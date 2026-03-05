import { Database } from "./database.types"

export type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}

export type FormConfig = Database['public']['Tables']['form_configs']['Row']
export type City = Database['public']['Tables']['cities']['Row']
export type Region = Database['public']['Tables']['regions']['Row']
