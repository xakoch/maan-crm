'use server'

import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { sendLeadNotification } from "@/lib/telegram/notifications"

export async function submitPublicLead(formData: {
    name: string
    phone: string
    city: string
    region?: string
}) {
    // 1. Init Admin Client (Service Role)
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // 2. Find Tenant (Dealer)
        let tenantId = null

        // Fetch all potential tenants for this city to perform matching logic
        const { data: cityTenants } = await supabase
            .from('tenants')
            .select('id, city, region')
            .eq('city', formData.city)
            .eq('status', 'active')

        if (cityTenants && cityTenants.length > 0) {
            // Logic:
            // 1. Try exact match on city AND region (if region provided)
            // 2. If region provided but no exact match, fallback to city? (Maybe safest is to just pick one if region match fails but city is correct?)
            // 3. If region NOT provided, pick any in city.

            let match = null;

            if (formData.region) {
                match = cityTenants.find(t => t.region === formData.region)
            }

            // Fallback or no region provided
            if (!match) {
                // If user didn't provide region, or provided region wasn't found (shouldn't happen if UI is consistent), take first one.
                // However, if UI provided region, usually it means it exists.
                match = cityTenants[0]
            }

            if (match) tenantId = match.id
        }

        // 3. Find Manager
        let assignedManagerId = null
        let managerToSend = null

        if (tenantId) {
            const { data: managers } = await supabase
                .from("users")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("role", "manager")
                .eq("is_active", true)

            if (managers && managers.length > 0) {
                // Random assignment
                const randomIndex = Math.floor(Math.random() * managers.length)
                managerToSend = managers[randomIndex]
                assignedManagerId = managerToSend.id
            }
        }

        // 4. Insert Lead
        const { data: lead, error } = await supabase
            .from('leads')
            .insert({
                name: formData.name,
                phone: formData.phone,
                city: formData.city,
                region: formData.region || null,
                tenant_id: tenantId,
                assigned_manager_id: assignedManagerId,
                source: 'website',
                status: assignedManagerId ? 'processing' : 'new'
            })
            .select()
            .single()

        if (error) throw error

        // 5. Create History
        await supabase.from('lead_history').insert({
            lead_id: lead.id,
            new_status: lead.status,
            comment: 'Заявка с сайта'
        })

        // 6. Notify Telegram
        if (managerToSend) {
            await sendLeadNotification(lead, managerToSend, supabase)
        }

        return { success: true }

    } catch (error: any) {
        console.error("Submit Public Lead Error:", error)
        return { success: false, error: error.message || "Ошибка сервера" }
    }
}
