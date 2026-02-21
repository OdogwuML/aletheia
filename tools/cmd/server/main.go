package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aletheia/backend/internal/handlers"
	mw "github.com/aletheia/backend/internal/middleware"
	"github.com/joho/godotenv"
	supabase "github.com/supabase-community/supabase-go"
)

func main() {
	// Load .env file (ignored if not found, e.g. in production)
	_ = godotenv.Load("../.env")

	// Load environment variables
	supabaseURL := getEnv("SUPABASE_URL", "https://mnwjsmkawisyisauxeyy.supabase.co")
	supabaseKey := getEnv("SUPABASE_ANON_KEY", "")
	port := getEnv("PORT", "8080")

	if supabaseKey == "" {
		log.Fatal("SUPABASE_ANON_KEY is required")
	}

	// Initialize Supabase client
	client, err := supabase.NewClient(supabaseURL, supabaseKey, &supabase.ClientOptions{})
	if err != nil {
		log.Fatal("Failed to initialize Supabase client:", err)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(client)
	buildingsHandler := handlers.NewBuildingsHandler(client)
	paymentsHandler := handlers.NewPaymentsHandler(client)
	invitationsHandler := handlers.NewInvitationsHandler(client)
	maintenanceHandler := handlers.NewMaintenanceHandler(client)
	documentsHandler := handlers.NewDocumentsHandler(client)
	dashboardHandler := handlers.NewDashboardHandler(client)

	// Create router
	mux := http.NewServeMux()

	// ============================================
	// PUBLIC ROUTES (no auth required) - v1
	// ============================================
	mux.HandleFunc("POST /api/v1/auth/signup", authHandler.Signup)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/v1/auth/accept-invite", authHandler.AcceptInvite)
	mux.HandleFunc("GET /api/v1/invitations/verify", invitationsHandler.GetInviteByToken)
	mux.HandleFunc("POST /api/v1/webhooks/paystack", paymentsHandler.PaystackWebhook)

	// ============================================
	// AUTHENTICATED ROUTES - v1
	// ============================================
	authMw := mw.AuthMiddleware(supabaseURL, supabaseKey)

	// --- Dashboard ---
	mux.Handle("GET /api/v1/dashboard/landlord", authMw(mw.RequireRole("landlord")(http.HandlerFunc(dashboardHandler.LandlordDashboard))))
	mux.Handle("GET /api/v1/dashboard/tenant", authMw(mw.RequireRole("tenant")(http.HandlerFunc(dashboardHandler.TenantDashboard))))

	// --- Buildings (Landlord only) ---
	mux.Handle("GET /api/v1/buildings", authMw(mw.RequireRole("landlord")(http.HandlerFunc(buildingsHandler.ListBuildings))))
	mux.Handle("POST /api/v1/buildings", authMw(mw.RequireRole("landlord")(http.HandlerFunc(buildingsHandler.CreateBuilding))))
	mux.Handle("GET /api/v1/buildings/{id}", authMw(mw.RequireRole("landlord")(http.HandlerFunc(buildingsHandler.GetBuilding))))
	mux.Handle("PUT /api/v1/buildings/{id}", authMw(mw.RequireRole("landlord")(http.HandlerFunc(buildingsHandler.UpdateBuilding))))

	// --- Units (Landlord) ---
	mux.Handle("GET /api/v1/buildings/{id}/units", authMw(mw.RequireRole("landlord")(http.HandlerFunc(buildingsHandler.ListUnits))))
	mux.Handle("POST /api/v1/units", authMw(mw.RequireRole("landlord")(http.HandlerFunc(buildingsHandler.CreateUnit))))

	// --- Payments ---
	mux.Handle("POST /api/v1/payments/initialize", authMw(mw.RequireRole("tenant")(http.HandlerFunc(paymentsHandler.InitializePayment))))
	mux.Handle("GET /api/v1/payments", authMw(http.HandlerFunc(paymentsHandler.ListPayments)))

	// --- Invitations (Landlord) ---
	mux.Handle("POST /api/v1/invitations", authMw(mw.RequireRole("landlord")(http.HandlerFunc(invitationsHandler.SendInvite))))
	mux.Handle("GET /api/v1/invitations", authMw(mw.RequireRole("landlord")(http.HandlerFunc(invitationsHandler.ListInvitations))))

	// --- Maintenance Requests ---
	mux.Handle("POST /api/v1/maintenance", authMw(mw.RequireRole("tenant")(http.HandlerFunc(maintenanceHandler.CreateRequest))))
	mux.Handle("GET /api/v1/maintenance", authMw(http.HandlerFunc(maintenanceHandler.ListRequests)))
	mux.Handle("PUT /api/v1/maintenance/{id}/status", authMw(mw.RequireRole("landlord")(http.HandlerFunc(maintenanceHandler.UpdateRequestStatus))))

	// --- Documents ---
	mux.Handle("POST /api/v1/documents", authMw(http.HandlerFunc(documentsHandler.UploadDocument)))
	mux.Handle("GET /api/v1/documents", authMw(http.HandlerFunc(documentsHandler.ListDocuments)))

	// ============================================
	// STATIC FILE SERVER (frontend)
	// ============================================
	fs := http.FileServer(http.Dir("../web"))
	mux.Handle("/", fs)

	// Wrap everything with CORS
	handler := mw.CORSMiddleware(mux)

	fmt.Printf("🚀 Aletheia server running on http://localhost:%s\n", port)
	fmt.Println("📋 API endpoints: 22 routes registered")
	fmt.Println("🗄️  Database: Supabase (manged)")
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
