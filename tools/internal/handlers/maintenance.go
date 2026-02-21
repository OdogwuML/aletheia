package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/middleware"
	"github.com/aletheia/backend/internal/models"
	postgrest "github.com/supabase-community/postgrest-go"
	supabase "github.com/supabase-community/supabase-go"
)

type MaintenanceHandler struct {
	client *supabase.Client
}

func NewMaintenanceHandler(client *supabase.Client) *MaintenanceHandler {
	return &MaintenanceHandler{client: client}
}

// CreateRequest allows a tenant to submit a maintenance request
func (h *MaintenanceHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var req models.CreateMaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Title == "" || req.Description == "" {
		respondError(w, http.StatusBadRequest, "Title and description are required")
		return
	}

	// Get tenant's unit
	uData, _, err := h.client.From("units").Select("id, building_id", "exact", false).Eq("tenant_id", userID).Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to find your unit")
		return
	}

	var units []struct {
		ID         string `json:"id"`
		BuildingID string `json:"building_id"`
	}
	json.Unmarshal(uData, &units)

	if len(units) == 0 {
		respondError(w, http.StatusNotFound, "No unit assigned to your account")
		return
	}

	priority := req.Priority
	if priority == "" {
		priority = "medium"
	}

	mReq := map[string]interface{}{
		"tenant_id":   userID,
		"unit_id":     units[0].ID,
		"building_id": units[0].BuildingID,
		"title":       req.Title,
		"description": req.Description,
		"priority":    priority,
		"status":      "open",
	}

	data, _, err := h.client.From("maintenance_requests").Insert(mReq, false, "", "", "").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create request: "+err.Error())
		return
	}

	var created []models.MaintenanceRequest
	json.Unmarshal(data, &created)

	respondJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    created[0],
		Message: "Maintenance request submitted",
	})
}

// ListRequests returns maintenance requests (scoped by role)
func (h *MaintenanceHandler) ListRequests(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)

	query := h.client.From("maintenance_requests").Select("*, profiles!maintenance_requests_tenant_id_fkey(full_name), units(unit_number), buildings(name)", "exact", false).Order("created_at", &postgrest.OrderOpts{Ascending: false})

	if userRole == "tenant" {
		query = query.Eq("tenant_id", userID)
	} else {
		// Landlord: get requests for their buildings
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
			query = query.In("building_id", ids)
		}
	}

	data, _, err := query.Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch requests")
		return
	}

	var requests []json.RawMessage
	json.Unmarshal(data, &requests)

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    requests,
	})
}

// UpdateRequestStatus allows a landlord to update a request status
func (h *MaintenanceHandler) UpdateRequestStatus(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	reqID := getPathParam(r, "id")

	var req models.UpdateMaintenanceStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Verify the request is for a building the landlord owns
	mData, _, _ := h.client.From("maintenance_requests").Select("building_id", "exact", false).Eq("id", reqID).Execute()
	var mReqs []struct {
		BuildingID string `json:"building_id"`
	}
	json.Unmarshal(mData, &mReqs)

	if len(mReqs) == 0 {
		respondError(w, http.StatusNotFound, "Request not found")
		return
	}

	bData, _, _ := h.client.From("buildings").Select("id", "exact", false).Eq("id", mReqs[0].BuildingID).Eq("landlord_id", userID).Execute()
	var bCheck []struct {
		ID string `json:"id"`
	}
	json.Unmarshal(bData, &bCheck)

	if len(bCheck) == 0 {
		respondError(w, http.StatusForbidden, "Not your building")
		return
	}

	update := map[string]interface{}{
		"status": req.Status,
	}

	data, _, err := h.client.From("maintenance_requests").Update(update, "", "").Eq("id", reqID).Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update request")
		return
	}

	var updated []models.MaintenanceRequest
	json.Unmarshal(data, &updated)

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    updated[0],
		Message: "Request status updated",
	})
}
