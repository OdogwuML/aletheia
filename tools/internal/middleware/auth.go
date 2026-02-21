package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	supabase "github.com/supabase-community/supabase-go"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UserRoleKey contextKey = "user_role"
)

// AuthMiddleware validates the JWT token via Supabase Auth
func AuthMiddleware(supabaseURL, serviceKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeError(w, http.StatusUnauthorized, "Missing authorization header")
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token == authHeader {
				writeError(w, http.StatusUnauthorized, "Invalid authorization format")
				return
			}

			// Create an authenticated client using the user's token
			userClient, err := supabase.NewClient(supabaseURL, token, &supabase.ClientOptions{})
			if err != nil {
				writeError(w, http.StatusUnauthorized, "Invalid token")
				return
			}

			// Use the token to get user info
			user, err := userClient.Auth.GetUser()
			if err != nil {
				writeError(w, http.StatusUnauthorized, "Invalid or expired token")
				return
			}

			userID := user.ID.String()

			// Get user profile to determine role
			data, _, err := userClient.From("profiles").Select("role", "exact", false).Eq("id", userID).Execute()
			if err != nil {
				writeError(w, http.StatusUnauthorized, "User profile not found")
				return
			}

			var profiles []struct {
				Role string `json:"role"`
			}
			if err := json.Unmarshal(data, &profiles); err != nil || len(profiles) == 0 {
				writeError(w, http.StatusUnauthorized, "User profile not found")
				return
			}

			// Add user info to context
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserRoleKey, profiles[0].Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole checks that the user has the required role
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := r.Context().Value(UserRoleKey).(string)
			if !ok || userRole != role {
				writeError(w, http.StatusForbidden, "Insufficient permissions")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserID extracts the user ID from context
func GetUserID(r *http.Request) string {
	if id, ok := r.Context().Value(UserIDKey).(string); ok {
		return id
	}
	return ""
}

// GetUserRole extracts the user role from context
func GetUserRole(r *http.Request) string {
	if role, ok := r.Context().Value(UserRoleKey).(string); ok {
		return role
	}
	return ""
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	fmt.Fprintf(w, `{"success":false,"error":"%s"}`, msg)
}
