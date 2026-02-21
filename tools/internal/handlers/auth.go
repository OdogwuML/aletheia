package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/models"
	gotrue_types "github.com/supabase-community/gotrue-go/types"
	supabase "github.com/supabase-community/supabase-go"
)

type AuthHandler struct {
	client *supabase.Client
}

func NewAuthHandler(client *supabase.Client) *AuthHandler {
	return &AuthHandler{client: client}
}

// Signup handles new user registration (landlord or tenant direct signup)
func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.FullName == "" || req.Role == "" {
		respondError(w, http.StatusBadRequest, "Email, password, full_name, and role are required")
		return
	}

	if req.Role != "landlord" && req.Role != "tenant" {
		respondError(w, http.StatusBadRequest, "Role must be 'landlord' or 'tenant'")
		return
	}

	// Sign up with Supabase Auth
	session, err := h.client.Auth.Signup(gotrue_types.SignupRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, "Signup failed: "+err.Error())
		return
	}

	// Create profile record
	profile := map[string]interface{}{
		"id":        session.User.ID.String(),
		"role":      req.Role,
		"full_name": req.FullName,
		"email":     req.Email,
		"phone":     req.Phone,
	}

	_, _, err = h.client.From("profiles").Insert(profile, false, "", "", "").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create profile: "+err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			AccessToken:  session.AccessToken,
			RefreshToken: session.RefreshToken,
			User: models.Profile{
				ID:       session.User.ID.String(),
				Role:     req.Role,
				FullName: req.FullName,
				Email:    req.Email,
			},
		},
		Message: "Account created successfully",
	})
}

// Login handles user authentication
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	// Sign in with Supabase Auth
	session, err := h.client.SignInWithEmailPassword(req.Email, req.Password)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Get profile for role info
	userID := session.User.ID.String()
	data, _, err := h.client.From("profiles").Select("*", "exact", false).Eq("id", userID).Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch profile")
		return
	}

	var profiles []models.Profile
	json.Unmarshal(data, &profiles)

	var profile models.Profile
	if len(profiles) > 0 {
		profile = profiles[0]
	}

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			AccessToken:  session.AccessToken,
			RefreshToken: session.RefreshToken,
			User:         profile,
		},
	})
}

// AcceptInvite handles tenant invite acceptance — creates account and links to unit
func (h *AuthHandler) AcceptInvite(w http.ResponseWriter, r *http.Request) {
	var req models.AcceptInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Token == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		respondError(w, http.StatusBadRequest, "Token, email, password, and full_name are required")
		return
	}

	// Find the invitation by token
	data, _, err := h.client.From("invitations").Select("*, units(building_id)", "exact", false).Eq("token", req.Token).Eq("status", "pending").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to lookup invitation")
		return
	}

	var invitations []struct {
		models.Invitation
		Units struct {
			BuildingID string `json:"building_id"`
		} `json:"units"`
	}
	json.Unmarshal(data, &invitations)

	if len(invitations) == 0 {
		respondError(w, http.StatusNotFound, "Invalid or expired invitation")
		return
	}

	invite := invitations[0]

	// Sign up the tenant
	session, err := h.client.Auth.Signup(gotrue_types.SignupRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, "Signup failed: "+err.Error())
		return
	}

	tenantID := session.User.ID.String()

	// Create profile
	profile := map[string]interface{}{
		"id":        tenantID,
		"role":      "tenant",
		"full_name": req.FullName,
		"email":     req.Email,
		"phone":     req.Phone,
	}
	h.client.From("profiles").Insert(profile, false, "", "", "").Execute()

	// Link tenant to unit
	update := map[string]interface{}{
		"tenant_id": tenantID,
		"status":    "occupied",
	}
	h.client.From("units").Update(update, "", "").Eq("id", invite.UnitID).Execute()

	// Mark invitation as accepted
	invUpdate := map[string]interface{}{
		"status": "accepted",
	}
	h.client.From("invitations").Update(invUpdate, "", "").Eq("id", invite.ID).Execute()

	respondJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			AccessToken:  session.AccessToken,
			RefreshToken: session.RefreshToken,
			User: models.Profile{
				ID:       tenantID,
				Role:     "tenant",
				FullName: req.FullName,
				Email:    req.Email,
			},
		},
		Message: "Invitation accepted, account created",
	})
}
