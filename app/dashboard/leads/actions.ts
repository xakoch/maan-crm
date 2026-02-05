'use server'


import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/database.types"
import { sendLeadNotification, sendGroupLeadNotification } from "@/lib/telegram/notifications"

type LeadStatus = Database['public']['Tables']['leads']['Row']['status']

export async function createLead(values: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
        // 1. Insert Lead
        const { data: lead, error } = await supabase
            .from('leads')
            .insert([{
                name: values.name,
                phone: values.phone,
                city: values.city,
                region: values.region || null,
                tenant_id: values.tenant_id || null, // Ensure explicitly null if undefined/empty
                source: values.source || 'manual',
                status: values.status || 'new',
                assigned_manager_id: values.assigned_manager_id || null,
                comment: values.comment || null,
                company_name: values.company_name || null,
                lead_type: values.lead_type || 'person'
            }])
            .select()
            .single()

        if (error) {
            console.error("Create Lead Error:", error)
            return { success: false, error: error.message }
        }

        // 1.1 Create History
        if (lead) {
            await supabase.from('lead_history').insert({
                lead_id: lead.id,
                changed_by: user?.id,
                new_status: lead.status,
                comment: 'Лид создан'
            })
        }

        // 2. Handle Notification & Assignment
        const adminSupabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 2a. Send to Telegram Group (Priority for Temporary Flow)
        const telegramGroupId = process.env.TELEGRAM_GROUP_ID;
        if (telegramGroupId) {
            await sendGroupLeadNotification(lead, telegramGroupId);
        } else {
            console.log("TELEGRAM_GROUP_ID not set, skipping group notification");
        }

        let managerToSend = null;

        // Check if manager is already assigned
        if (lead.assigned_manager_id) {
            const { data: manager } = await adminSupabase
                .from('users')
                .select('*')
                .eq('id', lead.assigned_manager_id)
                .single();

            managerToSend = manager;
        } else if (lead.tenant_id) {
            // Find available manager for this tenant
            const { data: managers } = await adminSupabase
                .from('users')
                .select('*')
                .eq('tenant_id', lead.tenant_id)
                .eq('role', 'manager')
                .eq('is_active', true)
                .not('telegram_id', 'is', null)
                .order('created_at');

            if (managers && managers.length > 0) {
                managerToSend = managers[0];

                // Auto-assign
                await adminSupabase
                    .from('leads')
                    .update({ assigned_manager_id: managerToSend.id })
                    .eq('id', lead.id);
            }
        }

        if (managerToSend) {
            await sendLeadNotification(lead, managerToSend, adminSupabase);
        }

        revalidatePath('/dashboard/leads')
        return { success: true, data: lead }

    } catch (e: any) {
        console.error("Server Action Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}


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
