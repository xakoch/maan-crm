'use server'


import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/database.types"
import { sendLeadNotification, sendGroupLeadNotification } from "@/lib/telegram/notifications"
import { autoCreateClientFromLead } from "@/app/actions/auto-create-client"

type LeadStatus = string

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
                lead_type: values.lead_type || 'person',
                services: values.services || [],
                conversion_value: values.conversion_value || null
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

        revalidatePath('/lumara/dashboard/leads')
        revalidatePath('/maan/dashboard/leads')
        return { success: true, data: lead }

    } catch (e: any) {
        console.error("Server Action Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}


export async function bulkUpdateLeads(ids: string[], updates: { status?: LeadStatus; assigned_manager_id?: string }) {
    const supabase = await createClient()

    try {
        const updateData: Record<string, any> = {}
        if (updates.status) updateData.status = updates.status
        if (updates.assigned_manager_id) updateData.assigned_manager_id = updates.assigned_manager_id

        const { data, error } = await supabase
            .from('leads')
            .update(updateData)
            .in('id', ids)
            .select()

        if (error) {
            console.error("Bulk Update Error:", error)
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/leads')
        revalidatePath('/maan/dashboard/leads')
        return { success: true, updatedCount: data?.length || 0 }
    } catch (e: any) {
        console.error("Bulk Update Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
    const supabase = await createClient()

    try {
        // Get current lead to record old status
        const { data: currentLead } = await supabase
            .from('leads')
            .select('status')
            .eq('id', id)
            .single()

        const oldStatus = currentLead?.status || null

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

        // Record history for kanban drag
        if (oldStatus !== status) {
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('lead_history').insert({
                lead_id: id,
                changed_by: user?.id,
                old_status: oldStatus,
                new_status: status,
                comment: `Статус изменен (канбан): ${oldStatus} → ${status}`
            })
        }

        // Auto-create client when lead reaches a final stage
        const adminSupabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: stage } = await adminSupabase
            .from('pipeline_stages')
            .select('is_final')
            .eq('slug', status)
            .limit(1)
            .single()

        if (stage?.is_final) {
            await autoCreateClientFromLead(id)
        }

        revalidatePath('/lumara/dashboard/leads')
        revalidatePath('/maan/dashboard/leads')
        revalidatePath('/lumara/dashboard/clients')
        revalidatePath('/maan/dashboard/clients')
        return { success: true }
    } catch (e: any) {
        console.error("Server Action Exception:", e)
        return { success: false, error: e.message || "Unknown error" }
    }
}

export async function claimLead(leadId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Не авторизован" }

    try {
        // Check lead is still unclaimed
        const { data: lead } = await supabase
            .from('leads')
            .select('id, assigned_manager_id, status')
            .eq('id', leadId)
            .single()

        if (!lead) return { success: false, error: "Заявка не найдена" }
        if (lead.assigned_manager_id) return { success: false, error: "Заявка уже взята другим менеджером" }

        // Claim the lead
        const { error } = await supabase
            .from('leads')
            .update({
                assigned_manager_id: user.id,
                status: 'processing',
                updated_at: new Date().toISOString(),
            })
            .eq('id', leadId)
            .is('assigned_manager_id', null)

        if (error) return { success: false, error: error.message }

        // Record history
        await supabase.from('lead_history').insert({
            lead_id: leadId,
            changed_by: user.id,
            old_status: lead.status,
            new_status: 'processing',
            comment: 'Менеджер взял заявку',
        })

        revalidatePath('/lumara/dashboard/leads')
        revalidatePath('/maan/dashboard/leads')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Ошибка" }
    }
}

export async function bulkDeleteLeads(ids: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Не авторизован" }

    // Check that user is super_admin
    const adminSupabase = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: userDetails } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userDetails?.role !== 'super_admin') {
        return { success: false, error: "Недостаточно прав" }
    }

    try {
        // Fetch leads before deleting
        const { data: leads } = await adminSupabase
            .from('leads')
            .select('*')
            .in('id', ids)

        if (leads && leads.length > 0) {
            // Archive all leads
            await adminSupabase
                .from('deleted_leads')
                .insert(leads.map(lead => ({
                    original_lead_id: lead.id,
                    lead_data: lead,
                    deletion_reason: 'Массовое удаление (super_admin)',
                    deleted_by: user.id,
                })))

            // Record history
            await adminSupabase.from('lead_history').insert(
                leads.map(lead => ({
                    lead_id: lead.id,
                    changed_by: user.id,
                    old_status: lead.status,
                    new_status: 'deleted',
                    comment: 'Массовое удаление (super_admin)',
                }))
            )
        }

        // Delete leads
        const { error } = await adminSupabase
            .from('leads')
            .delete()
            .in('id', ids)

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath('/lumara/dashboard/leads')
        revalidatePath('/maan/dashboard/leads')
        return { success: true, deletedCount: ids.length }
    } catch (e: any) {
        return { success: false, error: e.message || "Ошибка удаления" }
    }
}

export async function deleteLead(leadId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Не авторизован" }

    try {
        // Fetch full lead data before deleting
        const { data: lead, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single()

        if (fetchError || !lead) {
            return { success: false, error: "Лид не найден" }
        }

        const adminSupabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Archive the lead
        const { error: archiveError } = await adminSupabase
            .from('deleted_leads')
            .insert({
                original_lead_id: lead.id,
                lead_data: lead,
                deletion_reason: reason,
                deleted_by: user.id,
            })

        if (archiveError) {
            return { success: false, error: "Ошибка архивации: " + archiveError.message }
        }

        // Record in history
        await adminSupabase.from('lead_history').insert({
            lead_id: leadId,
            changed_by: user.id,
            old_status: lead.status,
            new_status: 'deleted',
            comment: `Лид удален. Причина: ${reason}`,
        })

        // Delete the lead
        const { error: deleteError } = await adminSupabase
            .from('leads')
            .delete()
            .eq('id', leadId)

        if (deleteError) {
            return { success: false, error: "Ошибка удаления: " + deleteError.message }
        }

        revalidatePath('/lumara/dashboard/leads')
        revalidatePath('/maan/dashboard/leads')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Ошибка" }
    }
}
