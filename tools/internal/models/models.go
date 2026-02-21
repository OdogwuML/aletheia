package models

import "time"

// Profile extends Supabase auth.users with app-specific data
type Profile struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"` // "landlord" or "tenant"
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone,omitempty"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Building represents a property managed by a landlord
type Building struct {
	ID         string    `json:"id"`
	LandlordID string    `json:"landlord_id"`
	Name       string    `json:"name"`
	Address    string    `json:"address"`
	TotalUnits int       `json:"total_units"`
	PhotoURL   *string   `json:"photo_url,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// BuildingWithStats adds computed fields for dashboard display
type BuildingWithStats struct {
	Building
	OccupiedUnits int   `json:"occupied_units"`
	VacantUnits   int   `json:"vacant_units"`
	TotalCollected int64 `json:"total_collected"` // in kobo
	TotalPending   int64 `json:"total_pending"`   // in kobo
}

// Unit represents a rentable unit within a building
type Unit struct {
	ID          string     `json:"id"`
	BuildingID  string     `json:"building_id"`
	TenantID    *string    `json:"tenant_id,omitempty"`
	UnitNumber  string     `json:"unit_number"`
	RentAmount  int64      `json:"rent_amount"` // in kobo
	LeaseStart  *string    `json:"lease_start,omitempty"`
	LeaseEnd    *string    `json:"lease_end,omitempty"`
	Status      string     `json:"status"` // "occupied" or "vacant"
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// UnitWithTenant includes tenant profile info for landlord views
type UnitWithTenant struct {
	Unit
	TenantName  *string `json:"tenant_name,omitempty"`
	TenantEmail *string `json:"tenant_email,omitempty"`
	TenantPhone *string `json:"tenant_phone,omitempty"`
	PaymentStatus string `json:"payment_status"` // "paid", "pending", "overdue", "vacant"
}

// Payment represents a rent payment transaction
type Payment struct {
	ID                   string     `json:"id"`
	TenantID             string     `json:"tenant_id"`
	UnitID               string     `json:"unit_id"`
	BuildingID           string     `json:"building_id"`
	Amount               int64      `json:"amount"` // in kobo
	Currency             string     `json:"currency"`
	Status               string     `json:"status"` // "pending", "successful", "failed"
	PaymentMethod        *string    `json:"payment_method,omitempty"`
	PaystackReference    *string    `json:"paystack_reference,omitempty"`
	PaystackTransactionID *string   `json:"paystack_transaction_id,omitempty"`
	Period               string     `json:"period"` // e.g. "Jan 2026"
	PaidAt               *time.Time `json:"paid_at,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
}

// PaymentWithDetails includes tenant and building names for display
type PaymentWithDetails struct {
	Payment
	TenantName   string `json:"tenant_name"`
	BuildingName string `json:"building_name"`
	UnitNumber   string `json:"unit_number"`
}

// Invitation represents a tenant invite to a unit
type Invitation struct {
	ID         string    `json:"id"`
	UnitID     string    `json:"unit_id"`
	LandlordID string    `json:"landlord_id"`
	Email      *string   `json:"email,omitempty"`
	Phone      *string   `json:"phone,omitempty"`
	Token      string    `json:"token"`
	Status     string    `json:"status"` // "pending", "accepted", "expired"
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// InvitationWithDetails includes building/unit info for the invite page
type InvitationWithDetails struct {
	Invitation
	BuildingName string `json:"building_name"`
	BuildingAddress string `json:"building_address"`
	BuildingPhoto *string `json:"building_photo,omitempty"`
	UnitNumber   string `json:"unit_number"`
	RentAmount   int64  `json:"rent_amount"`
}

// Notification represents an email/SMS notification sent by the system
type Notification struct {
	ID      string                 `json:"id"`
	UserID  string                 `json:"user_id"`
	Channel string                 `json:"channel"` // "email" or "sms"
	Type    string                 `json:"type"`    // "payment_receipt", "late_reminder", "welcome", "tenant_invite"
	Payload map[string]interface{} `json:"payload"`
	SentAt  time.Time              `json:"sent_at"`
	Status  string                 `json:"status"` // "sent" or "failed"
}

// MaintenanceRequest represents a tenant's maintenance request
type MaintenanceRequest struct {
	ID          string    `json:"id"`
	TenantID    string    `json:"tenant_id"`
	UnitID      string    `json:"unit_id"`
	BuildingID  string    `json:"building_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Priority    string    `json:"priority"` // "low", "medium", "high", "urgent"
	Status      string    `json:"status"`   // "open", "in_progress", "resolved", "closed"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Document represents an uploaded file (lease agreement, receipt, etc.)
type Document struct {
	ID         string    `json:"id"`
	UploadedBy string    `json:"uploaded_by"`
	BuildingID *string   `json:"building_id,omitempty"`
	UnitID     *string   `json:"unit_id,omitempty"`
	Name       string    `json:"name"`
	Type       string    `json:"type"` // "lease_agreement", "receipt", "other"
	FileURL    string    `json:"file_url"`
	FileSize   int64     `json:"file_size"`
	CreatedAt  time.Time `json:"created_at"`
}
