package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/middleware"
	"github.com/aletheia/backend/internal/models"
	postgrest "github.com/supabase-community/postgrest-go"
	supabase "github.com/supabase-community/supabase-go"
)

type DocumentsHandler struct {
	client *supabase.Client
}

func NewDocumentsHandler(client *supabase.Client) *DocumentsHandler {
	return &DocumentsHandler{client: client}
}

// UploadDocument records a document upload (file uploaded to Supabase Storage separately)
func (h *DocumentsHandler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var req models.UploadDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" || req.Type == "" {
		respondError(w, http.StatusBadRequest, "Name and type are required")
		return
	}

	// File URL will be set after uploading to Supabase Storage
	fileURL := r.URL.Query().Get("file_url")
	if fileURL == "" {
		respondError(w, http.StatusBadRequest, "file_url is required")
		return
	}

	doc := map[string]interface{}{
		"uploaded_by": userID,
		"building_id": req.BuildingID,
		"unit_id":     req.UnitID,
		"name":        req.Name,
		"type":        req.Type,
		"file_url":    fileURL,
	}

	data, _, err := h.client.From("documents").Insert(doc, false, "", "", "").Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save document: "+err.Error())
		return
	}

	var created []models.Document
	json.Unmarshal(data, &created)

	respondJSON(w, http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    created[0],
		Message: "Document uploaded successfully",
	})
}

// ListDocuments returns documents scoped by role
func (h *DocumentsHandler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)

	query := h.client.From("documents").Select("*", "exact", false).Order("created_at", &postgrest.OrderOpts{Ascending: false})

	if userRole == "tenant" {
		// Get tenant's unit
		uData, _, _ := h.client.From("units").Select("id", "exact", false).Eq("tenant_id", userID).Execute()
		var units []struct {
			ID string `json:"id"`
		}
		json.Unmarshal(uData, &units)

		if len(units) > 0 {
			query = query.Eq("unit_id", units[0].ID)
		} else {
			respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: []interface{}{}})
			return
		}
	} else {
		query = query.Eq("uploaded_by", userID)
	}

	data, _, err := query.Execute()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch documents")
		return
	}

	var docs []models.Document
	json.Unmarshal(data, &docs)

	respondJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    docs,
	})
}
