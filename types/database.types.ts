export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string
                    name: string
                    city: string
                    region: string | null
                    address: string | null
                    owner_name: string | null
                    owner_phone: string | null
                    owner_email: string | null
                    status: 'active' | 'inactive'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    city: string
                    region?: string | null
                    address?: string | null
                    owner_name?: string | null
                    owner_phone?: string | null
                    owner_email?: string | null
                    status?: 'active' | 'inactive'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    city?: string
                    region?: string | null
                    address?: string | null
                    owner_name?: string | null
                    owner_phone?: string | null
                    owner_email?: string | null
                    status?: 'active' | 'inactive'
                    created_at?: string
                }
                Relationships: []
            }
            users: {
                Row: {
                    id: string
                    email: string
                    username: string | null
                    role: 'super_admin' | 'dealer' | 'manager'
                    tenant_id: string | null
                    telegram_id: number | null
                    telegram_username: string | null
                    full_name: string
                    phone: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    username?: string | null
                    role: 'super_admin' | 'dealer' | 'manager'
                    tenant_id?: string | null
                    telegram_id?: number | null
                    telegram_username?: string | null
                    full_name: string
                    phone?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    username?: string | null
                    role?: 'super_admin' | 'dealer' | 'manager'
                    tenant_id?: string | null
                    telegram_id?: number | null
                    telegram_username?: string | null
                    full_name?: string
                    phone?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    }
                ]
            }
            leads: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    city: string
                    region: string | null
                    tenant_id: string | null
                    assigned_manager_id: string | null
                    status: 'new' | 'processing' | 'closed' | 'rejected'
                    rejection_reason: string | null
                    conversion_value: number | null
                    source: string
                    comment: string | null
                    sent_to_telegram: boolean
                    created_at: string
                    updated_at: string
                    closed_at: string | null
                    company_name: string | null
                    lead_type: 'person' | 'organization'
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    city: string
                    region?: string | null
                    tenant_id?: string | null
                    assigned_manager_id?: string | null
                    status?: 'new' | 'processing' | 'closed' | 'rejected'
                    rejection_reason?: string | null
                    conversion_value?: number | null
                    source?: string
                    comment?: string | null
                    sent_to_telegram?: boolean
                    created_at?: string
                    updated_at?: string
                    closed_at?: string | null
                    company_name?: string | null
                    lead_type?: 'person' | 'organization'
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    city?: string
                    region?: string | null
                    tenant_id?: string | null
                    assigned_manager_id?: string | null
                    status?: 'new' | 'processing' | 'closed' | 'rejected'
                    rejection_reason?: string | null
                    conversion_value?: number | null
                    source?: string
                    comment?: string | null
                    sent_to_telegram?: boolean
                    created_at?: string
                    updated_at?: string
                    closed_at?: string | null
                    company_name?: string | null
                    lead_type?: 'person' | 'organization'
                }
                Relationships: [
                    {
                        foreignKeyName: "leads_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "leads_assigned_manager_id_fkey"
                        columns: ["assigned_manager_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            lead_history: {
                Row: {
                    id: string
                    lead_id: string | null
                    changed_by: string | null
                    old_status: string | null
                    new_status: string | null
                    comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    lead_id?: string | null
                    changed_by?: string | null
                    old_status?: string | null
                    new_status?: string | null
                    comment?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    lead_id?: string | null
                    changed_by?: string | null
                    old_status?: string | null
                    new_status?: string | null
                    comment?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "lead_history_lead_id_fkey"
                        columns: ["lead_id"]
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lead_history_changed_by_fkey"
                        columns: ["changed_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
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
