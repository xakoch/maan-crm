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
            cities: {
                Row: {
                    id: string
                    name_ru: string
                    name_uz: string
                    region: string
                    is_active: boolean
                    sort_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name_ru: string
                    name_uz: string
                    region: string
                    is_active?: boolean
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name_ru?: string
                    name_uz?: string
                    region?: string
                    is_active?: boolean
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            regions: {
                Row: {
                    id: string
                    slug: string
                    name_ru: string
                    name_uz: string
                    is_active: boolean
                    sort_order: number
                    has_districts: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    name_ru: string
                    name_uz: string
                    is_active?: boolean
                    sort_order?: number
                    has_districts?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    name_ru?: string
                    name_uz?: string
                    is_active?: boolean
                    sort_order?: number
                    has_districts?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            form_configs: {
                Row: {
                    id: string
                    slug: string
                    title_ru: string
                    title_uz: string
                    subtitle_ru: string | null
                    subtitle_uz: string | null
                    crm_type: 'lumara' | 'maan'
                    enabled_fields: string[]
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    title_ru: string
                    title_uz: string
                    subtitle_ru?: string | null
                    subtitle_uz?: string | null
                    crm_type?: 'lumara' | 'maan'
                    enabled_fields?: string[]
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    title_ru?: string
                    title_uz?: string
                    subtitle_ru?: string | null
                    subtitle_uz?: string | null
                    crm_type?: 'lumara' | 'maan'
                    enabled_fields?: string[]
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            companies: {
                Row: {
                    id: string
                    name: string
                    inn: string | null
                    address: string | null
                    contact_person: string | null
                    contact_phone: string | null
                    contact_email: string | null
                    tenant_id: string | null
                    comment: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    inn?: string | null
                    address?: string | null
                    contact_person?: string | null
                    contact_phone?: string | null
                    contact_email?: string | null
                    tenant_id?: string | null
                    comment?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    inn?: string | null
                    address?: string | null
                    contact_person?: string | null
                    contact_phone?: string | null
                    contact_email?: string | null
                    tenant_id?: string | null
                    comment?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "companies_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    }
                ]
            }
            clients: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    email: string | null
                    client_type: 'person' | 'organization'
                    inn: string | null
                    address: string | null
                    city: string | null
                    region: string | null
                    company_id: string | null
                    tenant_id: string | null
                    assigned_manager_id: string | null
                    comment: string | null
                    total_deal_value: number
                    lead_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    client_type?: 'person' | 'organization'
                    inn?: string | null
                    address?: string | null
                    city?: string | null
                    region?: string | null
                    company_id?: string | null
                    tenant_id?: string | null
                    assigned_manager_id?: string | null
                    comment?: string | null
                    total_deal_value?: number
                    lead_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    client_type?: 'person' | 'organization'
                    inn?: string | null
                    address?: string | null
                    city?: string | null
                    region?: string | null
                    company_id?: string | null
                    tenant_id?: string | null
                    assigned_manager_id?: string | null
                    comment?: string | null
                    total_deal_value?: number
                    lead_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "clients_company_id_fkey"
                        columns: ["company_id"]
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "clients_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "clients_assigned_manager_id_fkey"
                        columns: ["assigned_manager_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "clients_lead_id_fkey"
                        columns: ["lead_id"]
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    }
                ]
            }
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
                    is_maan: boolean
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
                    is_maan?: boolean
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
                    is_maan?: boolean
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
                    status: string
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
                    utm_source: string | null
                    utm_medium: string | null
                    utm_campaign: string | null
                    utm_content: string | null
                    utm_term: string | null
                    referrer_url: string | null
                    landing_page_url: string | null
                    device_type: string | null
                    browser: string | null
                    ip_address: string | null
                    services: string[]
                    form_config_id: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    city: string
                    region?: string | null
                    tenant_id?: string | null
                    assigned_manager_id?: string | null
                    status?: string
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
                    utm_source?: string | null
                    utm_medium?: string | null
                    utm_campaign?: string | null
                    utm_content?: string | null
                    utm_term?: string | null
                    referrer_url?: string | null
                    landing_page_url?: string | null
                    device_type?: string | null
                    browser?: string | null
                    ip_address?: string | null
                    services?: string[]
                    form_config_id?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    city?: string
                    region?: string | null
                    tenant_id?: string | null
                    assigned_manager_id?: string | null
                    status?: string
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
                    utm_source?: string | null
                    utm_medium?: string | null
                    utm_campaign?: string | null
                    utm_content?: string | null
                    utm_term?: string | null
                    referrer_url?: string | null
                    landing_page_url?: string | null
                    device_type?: string | null
                    browser?: string | null
                    ip_address?: string | null
                    services?: string[]
                    form_config_id?: string | null
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
            deleted_leads: {
                Row: {
                    id: string
                    original_lead_id: string
                    lead_data: any
                    deletion_reason: string
                    deleted_by: string | null
                    deleted_at: string
                }
                Insert: {
                    id?: string
                    original_lead_id: string
                    lead_data: any
                    deletion_reason: string
                    deleted_by?: string | null
                    deleted_at?: string
                }
                Update: {
                    id?: string
                    original_lead_id?: string
                    lead_data?: any
                    deletion_reason?: string
                    deleted_by?: string | null
                    deleted_at?: string
                }
                Relationships: []
            }
            pipeline_stages: {
                Row: {
                    id: string
                    slug: string
                    title: string
                    color: string
                    sort_order: number
                    crm_type: 'lumara' | 'maan'
                    is_system: boolean
                    is_final: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    title: string
                    color?: string
                    sort_order?: number
                    crm_type: 'lumara' | 'maan'
                    is_system?: boolean
                    is_final?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    title?: string
                    color?: string
                    sort_order?: number
                    crm_type?: 'lumara' | 'maan'
                    is_system?: boolean
                    is_final?: boolean
                    created_at?: string
                }
                Relationships: []
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
