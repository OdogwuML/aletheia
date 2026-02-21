package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/middleware"
	"github.com/aletheia/backend/internal/models"
	postgrest "github.com/supabase-community/postgrest-go"
	supabase "github.com/supabase-community/supabase-go"
)

type InvitationsHandler struct {
	client *supabase.Client
}

func NewInvitationsHandler(client *supabase.Client) *InvitationsHandler {
	return &InvitationsHandler{client: client}
}

// SendInvite sends an invitation to a tenant for a specific unit
func (h *InvitationsHandler) SendInvite(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var req models.SendInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UnitID == "" || (req.Email == "" && req.Phone == "") {
		respondError(w, http.StatusBadRequest, "Unit ID and at least email or phone are required")
		return
	}

	// Verify the unit belongs to a building owned by this landlord
	uData, _, err := h.client.From("units").Select("*, buildings!inner(landlord_id)", "exact", false).Eq("id", req.UnitID).Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to verify unit")
		return
	}

	var units []struct {
		models.Unit
		Buildings struct {
			LandlordID string `json:"landlord_id"`
		} `json:"buildings"`
	}
	json.Unmarshal(uData, &units)

	if len(units) == 0 || units[0].Buildings.LandlordID != userID {
		respondError(w, http.StatusForbidden, "Unit not found or not in your building")
		return
	}

	if units[0].Status == "occupied" {
		respondError(w, http.StatusBadRequest, "Unit is already occupied")
		return
	}

	// Generate unique invite token
	token := generateToken()

	invite := map[string]interface{}{
		"unit_id":     req.UnitID,
		"landlord_id": userID,
		"email":       req.Email,
		"phone":       req.Phone,
		"token":       token,
		"status":      "pending",
	}

	data, _, err := h.client.From("invitations").Insert(invite, false, "", "", "").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create invitation: "+err.Error())
		return
	}

	var created []models.Invitation
	json.Unmarshal(data, &created)

	// TODO: Send email via Resend and/or SMS via Termii with the invite link
	// The invite link would be: APP_URL/invite?token=<token>

	respondJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    created[0],
		Message: "Invitation sent successfully",
	})
}

// GetInviteByToken retrieves invitation details for the acceptance page (public)
func (h *InvitationsHandler) GetInviteByToken(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Token is required")
		return
	}

	data, _, err := h.client.From("invitations").Select("*, units(unit_number, rent_amount), buildings:units(buildings(name, address, photo_url))", "exact", false).Eq("token", token).Eq("status", "pending").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch invitation")
		return
	}

	var invitations []json.RawMessage
	json.Unmarshal(data, &invitations)

	if len(invitations) == 0 {
		respondError(w, http.StatusNotFound, "Invalid or expired invitation")
		return
	}

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    invitations[0],
	})
}

// ListInvitations returns all invitations for a landlord
func (h *InvitationsHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	data, _, err := h.client.From("invitations").Select("*, units(unit_number, building_id)", "exact", false).Eq("landlord_id", userID).Order("created_at", &postgrest.OrderOpts{Ascending: false}).Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch invitations")
		return
	}

	var invitations []json.RawMessage
	json.Unmarshal(data, &invitations)

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    invitations,
	})
}

func generateToken() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
