package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/middleware"
	"github.com/aletheia/backend/internal/models"
	postgrest "github.com/supabase-community/postgrest-go"
	supabase "github.com/supabase-community/supabase-go"
)

type DashboardHandler struct {
	client *supabase.Client
}

func NewDashboardHandler(client *supabase.Client) *DashboardHandler {
	return &DashboardHandler{client: client}
}

// LandlordDashboard returns aggregated stats for the landlord
func (h *DashboardHandler) LandlordDashboard(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Get buildings
	bData, _, _ := h.client.From("buildings").Select("*", "exact", false).Eq("landlord_id", userID).Execute()
	var buildings []models.Building
	json.Unmarshal(bData, &buildings)

	// Get all units across buildings
	totalUnits := 0
	occupiedUnits := 0
	for _, b := range buildings {
		uData, _, _ := h.client.From("units").Select("status", "exact", false).Eq("building_id", b.ID).Execute()
		var units []struct {
			Status string `json:"status"`
		}
		json.Unmarshal(uData, &units)
		totalUnits += len(units)
		for _, u := range units {
			if u.Status == "occupied" {
				occupiedUnits++
			}
		}
	}

	// Get payment stats
	var totalCollected int64
	var totalPending int64
	for _, b := range buildings {
		pData, _, _ := h.client.From("payments").Select("amount, status", "exact", false).Eq("building_id", b.ID).Execute()
		var payments []struct {
			Amount int64  `json:"amount"`
			Status string `json:"status"`
		}
		json.Unmarshal(pData, &payments)
		for _, p := range payments {
			if p.Status == "successful" {
				totalCollected += p.Amount
			} else if p.Status == "pending" {
				totalPending += p.Amount
			}
		}
	}

	// Recent payments
	rpData, _, _ := h.client.From("payments").Select("*, profiles!payments_tenant_id_fkey(full_name), buildings(name), units(unit_number)", "exact", false).Eq("status", "successful").Order("created_at", &postgrest.OrderOpts{Ascending: false}).Limit(5, "").Execute()
	var recentPayments []json.RawMessage
	json.Unmarshal(rpData, &recentPayments)

	dashboard := map[string]interface{}{
		"total_buildings":  len(buildings),
		"total_units":      totalUnits,
		"occupied_units":   occupiedUnits,
		"total_collected":  totalCollected,
		"total_pending":    totalPending,
		"recent_payments":  recentPayments,
		"active_buildings": buildings,
	}

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    dashboard,
	})
}

// TenantDashboard returns the tenant's unit, building, and payment info
func (h *DashboardHandler) TenantDashboard(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Get profile
	profData, _, _ := h.client.From("profiles").Select("*", "exact", false).Eq("id", userID).Execute()
	var profiles []models.Profile
	json.Unmarshal(profData, &profiles)

	if len(profiles) == 0 {
		respondError(w, http.StatusNotFound, "Profile not found")
		return
	}

	// Get assigned unit
	uData, _, _ := h.client.From("units").Select("*, buildings(*)", "exact", false).Eq("tenant_id", userID).Execute()
	var units []struct {
		models.Unit
		Buildings models.Building `json:"buildings"`
	}
	json.Unmarshal(uData, &units)

	if len(units) == 0 {
		// Tenant has no unit yet
		respondJSON(w, http.StatusOK, models.APIResponse{
			Success: true,
			Data: map[string]interface{}{
				"profile":    profiles[0],
				"unit":       nil,
				"building":   nil,
				"total_paid": 0,
				"message":    "No unit assigned. Accept an invitation to get started.",
			},
		})
		return
	}

	unit := units[0]

	// Get payment history for this unit
	pData, _, _ := h.client.From("payments").Select("*", "exact", false).Eq("tenant_id", userID).Eq("unit_id", unit.ID).Order("created_at", &postgrest.OrderOpts{Ascending: false}).Execute()
	var payments []models.Payment
	json.Unmarshal(pData, &payments)

	var totalPaid int64
	var lastPayment *models.Payment
	for _, p := range payments {
		if p.Status == "successful" {
			totalPaid += p.Amount
		}
	}
	if len(payments) > 0 {
		lastPayment = &payments[0]
	}

	dashboard := map[string]interface{}{
		"profile":      profiles[0],
		"unit":         unit.Unit,
		"building":     unit.Buildings,
		"total_paid":   totalPaid,
		"last_payment": lastPayment,
		"next_amount":  unit.RentAmount,
	}

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    dashboard,
	})
}
