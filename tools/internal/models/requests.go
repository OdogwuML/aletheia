package models

// --- Auth Request/Response ---

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"` // "landlord" or "tenant"
	Phone    string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken  string  `json:"access_token"`
	RefreshToken string  `json:"refresh_token"`
	User         Profile `json:"user"`
}

type AcceptInviteRequest struct {
	Token    string `json:"token"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone,omitempty"`
}

// --- Building Request ---

type CreateBuildingRequest struct {
	Name       string `json:"name"`
	Address    string `json:"address"`
	TotalUnits int    `json:"total_units"`
	PhotoURL   string `json:"photo_url,omitempty"`
}

type UpdateBuildingRequest struct {
	Name       *string `json:"name,omitempty"`
	Address    *string `json:"address,omitempty"`
	TotalUnits *int    `json:"total_units,omitempty"`
	PhotoURL   *string `json:"photo_url,omitempty"`
}

// --- Unit Request ---

type CreateUnitRequest struct {
	BuildingID string `json:"building_id"`
	UnitNumber string `json:"unit_number"`
	RentAmount int64  `json:"rent_amount"` // in kobo
	LeaseStart string `json:"lease_start,omitempty"`
	LeaseEnd   string `json:"lease_end,omitempty"`
}

type UpdateUnitRequest struct {
	UnitNumber *string `json:"unit_number,omitempty"`
	RentAmount *int64  `json:"rent_amount,omitempty"`
	LeaseStart *string `json:"lease_start,omitempty"`
	LeaseEnd   *string `json:"lease_end,omitempty"`
}

// --- Invitation Request ---

type SendInviteRequest struct {
	UnitID string `json:"unit_id"`
	Email  string `json:"email,omitempty"`
	Phone  string `json:"phone,omitempty"`
}

// --- Payment Request ---

type InitializePaymentRequest struct {
	UnitID string `json:"unit_id"`
	Period string `json:"period"` // e.g. "Feb 2026"
}

type InitializePaymentResponse struct {
	AuthorizationURL string `json:"authorization_url"`
	Reference        string `json:"reference"`
	AccessCode       string `json:"access_code"`
}

// --- Maintenance Request ---

type CreateMaintenanceRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority,omitempty"` // defaults to "medium"
}

type UpdateMaintenanceStatusRequest struct {
	Status string `json:"status"` // "open", "in_progress", "resolved", "closed"
}

// --- Document Request ---

type UploadDocumentRequest struct {
	BuildingID string `json:"building_id,omitempty"`
	UnitID     string `json:"unit_id,omitempty"`
	Name       string `json:"name"`
	Type       string `json:"type"` // "lease_agreement", "receipt", "other"
}

// --- Dashboard Response ---

type LandlordDashboard struct {
	TotalBuildings  int                  `json:"total_buildings"`
	TotalUnits      int                  `json:"total_units"`
	OccupiedUnits   int                  `json:"occupied_units"`
	TotalCollected  int64                `json:"total_collected"`  // kobo
	TotalPending    int64                `json:"total_pending"`    // kobo
	TotalOverdue    int64                `json:"total_overdue"`    // kobo
	RecentPayments  []PaymentWithDetails `json:"recent_payments"`
	ActiveBuildings []BuildingWithStats  `json:"active_buildings"`
}

type TenantDashboard struct {
	Profile     Profile  `json:"profile"`
	Unit        Unit     `json:"unit"`
	Building    Building `json:"building"`
	TotalPaid   int64    `json:"total_paid"`   // kobo
	LastPayment *Payment `json:"last_payment"`
	NextDueDate *string  `json:"next_due_date"`
	NextAmount  int64    `json:"next_amount"` // kobo
}

// --- Generic Response ---

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}
