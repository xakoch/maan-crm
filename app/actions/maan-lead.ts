'use server'

import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { sendLeadNotification, sendGroupLeadNotification } from "@/lib/telegram/notifications"
import { headers } from "next/headers"
import { getMaanTenantId } from "@/lib/maan"

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

export async function submitMaanLead(formData: {
    name: string
    phone: string
    tracking?: LeadTrackingInput
}) {
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const headersList = await headers()
        const ip_address = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
            || headersList.get("x-real-ip")
            || null

        const tracking = formData.tracking || {}
        const maanTenantId = await getMaanTenantId()

        // Find available MAAN managers
        let assignedManagerId = null
        let managerToSend = null

        const { data: managers } = await supabase
            .from("users")
            .select("*")
            .eq("tenant_id", maanTenantId)
            .eq("role", "manager")
            .eq("is_active", true)

        if (managers && managers.length > 0) {
            const randomIndex = Math.floor(Math.random() * managers.length)
            managerToSend = managers[randomIndex]
            assignedManagerId = managerToSend.id
        }

        // Insert Lead
        const { data: lead, error } = await supabase
            .from('leads')
            .insert({
                name: formData.name,
                phone: formData.phone,
                city: 'MAAN',
                tenant_id: maanTenantId,
                assigned_manager_id: assignedManagerId,
                source: 'maan-form',
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

        // Create History
        await supabase.from('lead_history').insert({
            lead_id: lead.id,
            new_status: lead.status,
            comment: 'Заявка с MAAN формы'
        })

        // Notify Telegram Group
        const telegramGroupId = process.env.TELEGRAM_GROUP_ID;
        if (telegramGroupId) {
            await sendGroupLeadNotification(lead, telegramGroupId);
        }

        // Notify Manager
        if (managerToSend) {
            await sendLeadNotification(lead, managerToSend, supabase)
        }

        return { success: true }

    } catch (error: any) {
        console.error("Submit MAAN Lead Error:", error)
        return { success: false, error: error.message || "Ошибка сервера" }
    }
}
