'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function autoCreateClientFromLead(leadId: string) {
    const supabase = await createClient()

    try {
        // Check if client already exists for this lead
        const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('lead_id', leadId)
            .single()

        if (existingClient) {
            return { success: true, data: existingClient, alreadyExists: true }
        }

        // Fetch lead data
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single()

        if (leadError || !lead) {
            return { success: false, error: 'Лид не найден' }
        }

        // If organization with company_name, find or create company
        let companyId: string | null = null
        if (lead.lead_type === 'organization' && lead.company_name) {
            // Try to find existing company by name + tenant
            let companyQuery = supabase
                .from('companies')
                .select('id')
                .eq('name', lead.company_name)

            if (lead.tenant_id) {
                companyQuery = companyQuery.eq('tenant_id', lead.tenant_id)
            }

            const { data: existingCompany } = await companyQuery.single()

            if (existingCompany) {
                companyId = existingCompany.id
            } else {
                // Create new company
                const { data: newCompany } = await supabase
                    .from('companies')
                    .insert([{
                        name: lead.company_name,
                        tenant_id: lead.tenant_id,
                    }])
                    .select()
                    .single()

                if (newCompany) {
                    companyId = newCompany.id
                }
            }
        }

        // Create client from lead data
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert([{
                name: lead.name,
                phone: lead.phone,
                client_type: lead.lead_type || 'person',
                city: lead.city,
                region: lead.region,
                company_id: companyId,
                tenant_id: lead.tenant_id,
                assigned_manager_id: lead.assigned_manager_id,
                total_deal_value: lead.conversion_value || 0,
                lead_id: lead.id,
                comment: lead.comment,
            }])
            .select()
            .single()

        if (clientError) {
            console.error("Auto-create client error:", clientError)
            return { success: false, error: clientError.message }
        }

        revalidatePath('/lumara/dashboard/clients')
        revalidatePath('/maan/dashboard/clients')
        revalidatePath('/lumara/dashboard/companies')
        revalidatePath('/maan/dashboard/companies')
        return { success: true, data: client }
    } catch (e: any) {
        console.error("Auto-create client exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}
