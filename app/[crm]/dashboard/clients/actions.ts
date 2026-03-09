'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClientRecord(values: any) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                name: values.name,
                phone: values.phone || null,
                email: values.email || null,
                client_type: values.client_type || 'person',
                inn: values.inn || null,
                address: values.address || null,
                city: values.city || null,
                region: values.region || null,
                company_id: values.company_id || null,
                tenant_id: values.tenant_id || null,
                assigned_manager_id: values.assigned_manager_id || null,
                comment: values.comment || null,
                total_deal_value: values.total_deal_value || 0,
                lead_id: values.lead_id || null,
            }])
            .select()
            .single()

        if (error) {
            console.error("Create Client Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/clients')
        revalidatePath('/maan/dashboard/clients')
        return { success: true, data }
    } catch (e: any) {
        console.error("Create Client Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}

export async function updateClientRecord(id: string, values: any) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('clients')
            .update({
                name: values.name,
                phone: values.phone || null,
                email: values.email || null,
                client_type: values.client_type || 'person',
                inn: values.inn || null,
                address: values.address || null,
                city: values.city || null,
                region: values.region || null,
                company_id: values.company_id || null,
                tenant_id: values.tenant_id || null,
                assigned_manager_id: values.assigned_manager_id || null,
                comment: values.comment || null,
                total_deal_value: values.total_deal_value || 0,
            })
            .eq('id', id)

        if (error) {
            console.error("Update Client Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/clients')
        revalidatePath('/maan/dashboard/clients')
        revalidatePath(`/lumara/dashboard/clients/${id}`)
        revalidatePath(`/maan/dashboard/clients/${id}`)
        return { success: true }
    } catch (e: any) {
        console.error("Update Client Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}

export async function deleteClientRecord(id: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Delete Client Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/clients')
        revalidatePath('/maan/dashboard/clients')
        return { success: true }
    } catch (e: any) {
        console.error("Delete Client Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}
