'use server'

import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { sendLeadNotification, sendGroupLeadNotification } from "@/lib/telegram/notifications"
import { headers } from "next/headers"

interface LeadTrackingInput {
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    utm_content?: string | null
    utm_term?: string | null
    referrer_url?: string | null
    landing_page_url?: string | null
    device_type?: string | null
    browser?: string | null
}

export async function submitPublicLead(formData: {
    name: string
    phone: string
    city: string
    region?: string
    tracking?: LeadTrackingInput
}) {
    // 1. Init Admin Client (Service Role)
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // Capture IP address from request headers
        const headersList = await headers()
        const ip_address = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
            || headersList.get("x-real-ip")
            || null

        const tracking = formData.tracking || {}

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
                source: tracking.utm_source || 'website',
                status: assignedManagerId ? 'processing' : 'new',
                utm_source: tracking.utm_source || null,
                utm_medium: tracking.utm_medium || null,
                utm_campaign: tracking.utm_campaign || null,
                utm_content: tracking.utm_content || null,
                utm_term: tracking.utm_term || null,
                referrer_url: tracking.referrer_url || null,
                landing_page_url: tracking.landing_page_url || null,
                device_type: tracking.device_type || null,
                browser: tracking.browser || null,
                ip_address: ip_address,
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

        // 6a. Send to Group
        const telegramGroupId = process.env.TELEGRAM_GROUP_ID;
        if (telegramGroupId) {
            await sendGroupLeadNotification(lead, telegramGroupId);
        }

        // 6b. Send to Manager
        if (managerToSend) {
            await sendLeadNotification(lead, managerToSend, supabase)
        }

        return { success: true }

    } catch (error: any) {
        console.error("Submit Public Lead Error:", error)
        return { success: false, error: error.message || "Ошибка сервера" }
    }
}
