'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/database.types"

type LeadStatus = Database['public']['Tables']['leads']['Row']['status']

export async function updateLeadStatus(id: string, status: LeadStatus) {
    console.log("=== SERVER ACTION CALLED ===")
    console.log("Lead ID:", id)
    console.log("New Status:", status)

    const supabase = await createClient()

    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log("Current user:", user?.email || "No user", userError?.message || "")

    try {
        // First, let's see what the current status is
        const { data: currentLead, error: selectError } = await supabase
            .from('leads')
            .select('id, status, name')
            .eq('id', id)
            .single()

        console.log("Current lead data:", currentLead)
        if (selectError) {
            console.error("Select error:", selectError)
        }

        // Now update
        const { data, error } = await supabase
            .from('leads')
            .update({ status })
            .eq('id', id)
            .select()

        console.log("Update result - data:", data)
        console.log("Update result - error:", error)

        if (error) {
            console.error("Server Action Update Error:", error)
            return { success: false, error: error.message }
        }

        if (!data || data.length === 0) {
            console.error("No rows updated - possibly RLS issue")
            return { success: false, error: "Запись не обновлена. Проверьте права доступа." }
        }

        revalidatePath('/dashboard/leads')
        console.log("=== UPDATE SUCCESS ===")
        return { success: true }
    } catch (e: any) {
        console.error("Server Action Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}
