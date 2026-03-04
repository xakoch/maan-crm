'use server'

import { createClient } from "@/lib/supabase/server"

export interface NotificationItem {
    id: string
    lead_id: string
    lead_name: string
    new_status: string
    comment: string | null
    changed_by_name: string | null
    created_at: string
}

export async function getRecentNotifications(lastSeenAt: string): Promise<NotificationItem[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single()

    // Fetch recent lead_history entries after lastSeenAt
    let query = supabase
        .from('lead_history')
        .select(`
            id,
            lead_id,
            new_status,
            comment,
            changed_by,
            created_at,
            leads:lead_id (name, tenant_id, assigned_manager_id)
        `)
        .gt('created_at', lastSeenAt)
        .order('created_at', { ascending: false })
        .limit(50)

    const { data: history } = await query

    if (!history || history.length === 0) return []

    // Filter by tenant/role visibility
    let filtered = history.filter((h: any) => {
        const lead = h.leads
        if (!lead) return false
        if (profile?.role === 'super_admin') return true
        if (profile?.role === 'dealer' && lead.tenant_id === profile.tenant_id) return true
        if (profile?.role === 'manager' && lead.assigned_manager_id === user.id) return true
        return false
    })

    // Exclude own changes
    filtered = filtered.filter((h: any) => h.changed_by !== user.id)

    // Fetch changed_by user names
    const changedByIds = [...new Set(filtered.map((h: any) => h.changed_by).filter(Boolean))]
    let usersMap = new Map<string, string>()
    if (changedByIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', changedByIds)
        users?.forEach(u => usersMap.set(u.id, u.full_name))
    }

    return filtered.map((h: any) => ({
        id: h.id,
        lead_id: h.lead_id,
        lead_name: h.leads?.name || 'Неизвестный',
        new_status: h.new_status || '',
        comment: h.comment,
        changed_by_name: h.changed_by ? usersMap.get(h.changed_by) || null : null,
        created_at: h.created_at,
    }))
}
