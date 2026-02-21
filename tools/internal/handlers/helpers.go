package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/aletheia/backend/internal/models"
)

// respondJSON writes a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError writes a JSON error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, models.APIResponse{
		Success: false,
		Error:   message,
	})
}

// getPathParam extracts a path parameter from the URL
// For routes like /api/buildings/{id}, pass the full path and index
func getPathParam(r *http.Request, name string) string {
	return r.PathValue(name)
}
