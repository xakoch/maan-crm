import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"

let cachedMaanTenantId: string | null = null

export async function getMaanTenantId(): Promise<string> {
    if (cachedMaanTenantId) return cachedMaanTenantId

    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from("tenants")
        .select("id")
        .eq("is_maan", true)
        .single()

    if (error || !data) {
        throw new Error("MAAN tenant not found. Please run the migration to create it.")
    }

    cachedMaanTenantId = data.id
    return data.id
}
