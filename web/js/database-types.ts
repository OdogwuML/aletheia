export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            buildings: {
                Row: {
                    address: string
                    created_at: string
                    id: string
                    landlord_id: string
                    name: string
                    photo_url: string | null
                    total_units: number
                    updated_at: string
                }
                Insert: {
                    address: string
                    created_at?: string
                    id?: string
                    landlord_id: string
                    name: string
                    photo_url?: string | null
                    total_units?: number
                    updated_at?: string
                }
                Update: {
                    address?: string
                    created_at?: string
                    id?: string
                    landlord_id?: string
                    name?: string
                    photo_url?: string | null
                    total_units?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "buildings_landlord_id_fkey"
                        columns: ["landlord_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            documents: {
                Row: {
                    building_id: string | null
                    created_at: string
                    file_size: number | null
                    file_url: string
                    id: string
                    name: string
                    type: string
                    unit_id: string | null
                    uploaded_by: string
                }
                Insert: {
                    building_id?: string | null
                    created_at?: string
                    file_size?: number | null
                    file_url: string
                    id?: string
                    name: string
                    type?: string
                    unit_id?: string | null
                    uploaded_by: string
                }
                Update: {
                    building_id?: string | null
                    created_at?: string
                    file_size?: number | null
                    file_url?: string
                    id?: string
                    name?: string
                    type?: string
                    unit_id?: string | null
                    uploaded_by?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "documents_building_id_fkey"
                        columns: ["building_id"]
                        isOneToOne: false
                        referencedRelation: "buildings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invitations: {
                Row: {
                    created_at: string
                    email: string | null
                    expires_at: string
                    id: string
                    landlord_id: string
                    phone: string | null
                    status: string
                    token: string
                    unit_id: string
                }
                Insert: {
                    created_at?: string
                    email?: string | null
                    expires_at?: string
                    id?: string
                    landlord_id: string
                    phone?: string | null
                    status?: string
                    token: string
                    unit_id: string
                }
                Update: {
                    created_at?: string
                    email?: string | null
                    expires_at?: string
                    id?: string
                    landlord_id?: string
                    phone?: string | null
                    status?: string
                    token?: string
                    unit_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "invitations_landlord_id_fkey"
                        columns: ["landlord_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invitations_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                ]
            }
            maintenance_requests: {
                Row: {
                    building_id: string
                    created_at: string
                    description: string
                    id: string
                    priority: string
                    status: string
                    tenant_id: string
                    title: string
                    unit_id: string
                    updated_at: string
                }
                Insert: {
                    building_id: string
                    created_at?: string
                    description: string
                    id?: string
                    priority?: string
                    status?: string
                    tenant_id: string
                    title: string
                    unit_id: string
                    updated_at?: string
                }
                Update: {
                    building_id?: string
                    created_at?: string
                    description?: string
                    id?: string
                    priority?: string
                    status?: string
                    tenant_id?: string
                    title?: string
                    unit_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "maintenance_requests_building_id_fkey"
                        columns: ["building_id"]
                        isOneToOne: false
                        referencedRelation: "buildings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_requests_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_requests_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    channel: string
                    id: string
                    payload: Json
                    sent_at: string
                    status: string
                    type: string
                    user_id: string
                }
                Insert: {
                    channel: string
                    id?: string
                    payload?: Json
                    sent_at?: string
                    status?: string
                    type: string
                    user_id: string
                }
                Update: {
                    channel?: string
                    id?: string
                    payload?: Json
                    sent_at?: string
                    status?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payments: {
                Row: {
                    amount: number
                    building_id: string
                    created_at: string
                    currency: string
                    id: string
                    paid_at: string | null
                    payment_method: string | null
                    paystack_reference: string | null
                    paystack_transaction_id: string | null
                    period: string
                    status: string
                    tenant_id: string
                    unit_id: string
                }
                Insert: {
                    amount: number
                    building_id: string
                    created_at?: string
                    currency?: string
                    id?: string
                    paid_at?: string | null
                    payment_method?: string | null
                    paystack_reference?: string | null
                    paystack_transaction_id?: string | null
                    period: string
                    status?: string
                    tenant_id: string
                    unit_id: string
                }
                Update: {
                    amount?: number
                    building_id?: string
                    created_at?: string
                    currency?: string
                    id?: string
                    paid_at?: string | null
                    payment_method?: string | null
                    paystack_reference?: string | null
                    paystack_transaction_id?: string | null
                    period?: string
                    status?: string
                    tenant_id?: string
                    unit_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_building_id_fkey"
                        columns: ["building_id"]
                        isOneToOne: false
                        referencedRelation: "buildings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    email: string
                    full_name: string
                    id: string
                    phone: string | null
                    role: string
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    email: string
                    full_name: string
                    id: string
                    phone?: string | null
                    role: string
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    email?: string
                    full_name?: string
                    id?: string
                    phone?: string | null
                    role?: string
                    updated_at?: string
                }
                Relationships: []
            }
            units: {
                Row: {
                    building_id: string
                    created_at: string
                    id: string
                    lease_end: string | null
                    lease_start: string | null
                    rent_amount: number
                    status: string
                    tenant_id: string | null
                    unit_number: string
                    updated_at: string
                }
                Insert: {
                    building_id: string
                    created_at?: string
                    id?: string
                    lease_end?: string | null
                    lease_start?: string | null
                    rent_amount?: number
                    status?: string
                    tenant_id?: string | null
                    unit_number: string
                    updated_at?: string
                }
                Update: {
                    building_id?: string
                    created_at?: string
                    id?: string
                    lease_end?: string | null
                    lease_start?: string | null
                    rent_amount?: number
                    status?: string
                    tenant_id?: string | null
                    unit_number?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "units_building_id_fkey"
                        columns: ["building_id"]
                        isOneToOne: false
                        referencedRelation: "buildings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "units_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
