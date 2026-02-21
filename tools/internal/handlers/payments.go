package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/middleware"
	"github.com/aletheia/backend/internal/models"
	postgrest "github.com/supabase-community/postgrest-go"
	supabase "github.com/supabase-community/supabase-go"
)

type PaymentsHandler struct {
	client *supabase.Client
}

func NewPaymentsHandler(client *supabase.Client) *PaymentsHandler {
	return &PaymentsHandler{client: client}
}

// InitializePayment starts a Paystack payment for a tenant
func (h *PaymentsHandler) InitializePayment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var req models.InitializePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UnitID == "" || req.Period == "" {
		respondError(w, http.StatusBadRequest, "Unit ID and period are required")
		return
	}

	// Get unit details (verify tenant owns this unit)
	data, _, err := h.client.From("units").Select("*, buildings(id, name)", "exact", false).Eq("id", req.UnitID).Eq("tenant_id", userID).Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch unit")
		return
	}

	var units []struct {
		models.Unit
		Buildings struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"buildings"`
	}
	json.Unmarshal(data, &units)

	if len(units) == 0 {
		respondError(w, http.StatusNotFound, "Unit not found or not assigned to you")
		return
	}

	unit := units[0]

	// Create a pending payment record
	payment := map[string]interface{}{
		"tenant_id":   userID,
		"unit_id":     req.UnitID,
		"building_id": unit.Buildings.ID,
		"amount":      unit.RentAmount,
		"currency":    "NGN",
		"status":      "pending",
		"period":      req.Period,
	}

	payData, _, err := h.client.From("payments").Insert(payment, false, "", "", "").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create payment record")
		return
	}

	var payments []models.Payment
	json.Unmarshal(payData, &payments)

	// TODO: Initialize Paystack transaction using the payment reference
	// For now, return the payment record — Paystack integration will be added
	// when the API keys are available

	respondJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"payment":           payments[0],
			"amount_naira":      float64(unit.RentAmount) / 100,
			"authorization_url": "", // Will be filled by Paystack
			"reference":         payments[0].ID,
		},
		Message: "Payment initiated (Paystack integration pending)",
	})
}

// PaystackWebhook handles Paystack payment callbacks
func (h *PaymentsHandler) PaystackWebhook(w http.ResponseWriter, r *http.Request) {
	// TODO: Verify Paystack webhook signature
	// TODO: Parse the event and update the payment status

	var event map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Acknowledge receipt immediately (Paystack expects 200)
	w.WriteHeader(http.StatusOK)
}

// ListPayments returns payment history (scoped by role)
func (h *PaymentsHandler) ListPayments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)

	query := h.client.From("payments").Select("*, profiles!payments_tenant_id_fkey(full_name), buildings(name), units(unit_number)", "exact", false).Order("created_at", &postgrest.OrderOpts{Ascending: false})

	if userRole == "tenant" {
		query = query.Eq("tenant_id", userID)
	} else {
		// Landlord: filter by buildings they own
		// First get their building IDs
		bData, _, _ := h.client.From("buildings").Select("id", "exact", false).Eq("landlord_id", userID).Execute()
		var bIDs []struct {
			ID string `json:"id"`
		}
		json.Unmarshal(bData, &bIDs)

		if len(bIDs) > 0 {
			ids := make([]string, len(bIDs))
			for i, b := range bIDs {
				ids[i] = b.ID
			}
			// Use In filter for building_id
			query = query.In("building_id", ids)
		}
	}

	// Apply optional filters
	if status := r.URL.Query().Get("status"); status != "" {
		query = query.Eq("status", status)
	}
	if buildingID := r.URL.Query().Get("building_id"); buildingID != "" {
		query = query.Eq("building_id", buildingID)
	}

	data, _, err := query.Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch payments")
		return
	}

	var payments []json.RawMessage
	json.Unmarshal(data, &payments)

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    payments,
	})
}
