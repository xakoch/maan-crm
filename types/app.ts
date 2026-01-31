import { Database } from "./database.types"

export type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}
