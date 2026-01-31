'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/database.types"

type LeadStatus = Database['public']['Tables']['leads']['Row']['status']

export async function updateLeadStatus(id: string, status: LeadStatus) {
    const supabase = await createClient()

    try {
        // Now update
        const { data, error } = await supabase
            .from('leads')
            .update({ status })
            .eq('id', id)
            .select()

        if (error) {
            console.error("Server Action Update Error:", error)
            return { success: false, error: error.message }
        }

        if (!data || data.length === 0) {
            console.error("No rows updated - possibly RLS issue")
            return { success: false, error: "Запись не обновлена. Проверьте права доступа." }
        }

        revalidatePath('/dashboard/leads')
        return { success: true }
    } catch (e: any) {
        console.error("Server Action Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}
