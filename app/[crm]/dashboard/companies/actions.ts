'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCompany(values: any) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('companies')
            .insert([{
                name: values.name,
                inn: values.inn || null,
                address: values.address || null,
                contact_person: values.contact_person || null,
                contact_phone: values.contact_phone || null,
                contact_email: values.contact_email || null,
                tenant_id: values.tenant_id || null,
                comment: values.comment || null,
            }])
            .select()
            .single()

        if (error) {
            console.error("Create Company Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/companies')
        revalidatePath('/maan/dashboard/companies')
        return { success: true, data }
    } catch (e: any) {
        console.error("Create Company Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}

export async function updateCompany(id: string, values: any) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('companies')
            .update({
                name: values.name,
                inn: values.inn || null,
                address: values.address || null,
                contact_person: values.contact_person || null,
                contact_phone: values.contact_phone || null,
                contact_email: values.contact_email || null,
                tenant_id: values.tenant_id || null,
                comment: values.comment || null,
            })
            .eq('id', id)

        if (error) {
            console.error("Update Company Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/companies')
        revalidatePath('/maan/dashboard/companies')
        revalidatePath(`/lumara/dashboard/companies/${id}`)
        revalidatePath(`/maan/dashboard/companies/${id}`)
        return { success: true }
    } catch (e: any) {
        console.error("Update Company Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}

export async function deleteCompany(id: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Delete Company Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/companies')
        revalidatePath('/maan/dashboard/companies')
        return { success: true }
    } catch (e: any) {
        console.error("Delete Company Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}
