'use server'

import { createClient } from "@/lib/supabase/server"

export interface NotificationItem {
    id: string
    lead_id: string
    lead_name: string
    new_status: string
    old_status: string | null
    comment: string | null
    changed_by_name: string | null
    created_at: string
}

async function getVisibleHistory(
    supabase: any,
    userId: string,
    profile: any,
    options: { limit?: number; afterDate?: string; offset?: number }
) {
    let query = supabase
        .from('lead_history')
        .select(`
            id,
            lead_id,
            old_status,
            new_status,
            comment,
            changed_by,
            created_at,
            leads:lead_id (name, tenant_id, assigned_manager_id)
        `)
        .order('created_at', { ascending: false })

    if (options.afterDate) {
        query = query.gt('created_at', options.afterDate)
    }

    if (options.limit) {
        query = query.limit(options.limit)
    }

    if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data: history } = await query

    if (!history || history.length === 0) return []

    // Filter by tenant/role visibility
    let filtered = history.filter((h: any) => {
        const lead = h.leads
        if (!lead) return false
        if (profile?.role === 'super_admin') return true
        if (profile?.role === 'dealer' && lead.tenant_id === profile.tenant_id) return true
        if (profile?.role === 'manager' && lead.assigned_manager_id === userId) return true
        return false
    })

    // Exclude own changes
    filtered = filtered.filter((h: any) => h.changed_by !== userId)

    // Fetch changed_by user names
    const changedByIds = [...new Set(filtered.map((h: any) => h.changed_by).filter(Boolean))]
    let usersMap = new Map<string, string>()
    if (changedByIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', changedByIds)
        users?.forEach((u: any) => usersMap.set(u.id, u.full_name))
    }

    return filtered.map((h: any) => ({
        id: h.id,
        lead_id: h.lead_id,
        lead_name: h.leads?.name || 'Неизвестный',
        old_status: h.old_status || null,
        new_status: h.new_status || '',
        comment: h.comment,
        changed_by_name: h.changed_by ? usersMap.get(h.changed_by) || null : null,
        created_at: h.created_at,
    }))
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

    return getVisibleHistory(supabase, user.id, profile, {
        afterDate: lastSeenAt,
        limit: 50,
    })
}

export async function getAllNotifications(page: number = 0, pageSize: number = 30): Promise<{
    items: NotificationItem[]
    hasMore: boolean
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { items: [], hasMore: false }

    const { data: profile } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single()

    // Fetch more than needed to account for filtering
    const fetchLimit = pageSize * 3
    const { data: history } = await supabase
        .from('lead_history')
        .select(`
            id,
            lead_id,
            old_status,
            new_status,
            comment,
            changed_by,
            created_at,
            leads:lead_id (name, tenant_id, assigned_manager_id)
        `)
        .order('created_at', { ascending: false })
        .range(page * fetchLimit, (page + 1) * fetchLimit)

    if (!history || history.length === 0) return { items: [], hasMore: false }

    let filtered = history.filter((h: any) => {
        const lead = h.leads
        if (!lead) return false
        if (profile?.role === 'super_admin') return true
        if (profile?.role === 'dealer' && lead.tenant_id === profile.tenant_id) return true
        if (profile?.role === 'manager' && lead.assigned_manager_id === user.id) return true
        return false
    })

    filtered = filtered.filter((h: any) => h.changed_by !== user.id)

    const changedByIds = [...new Set(filtered.map((h: any) => h.changed_by).filter(Boolean))]
    let usersMap = new Map<string, string>()
    if (changedByIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', changedByIds)
        users?.forEach((u: any) => usersMap.set(u.id, u.full_name))
    }

    const items: NotificationItem[] = filtered.slice(0, pageSize).map((h: any) => ({
        id: h.id,
        lead_id: h.lead_id,
        lead_name: h.leads?.name || 'Неизвестный',
        old_status: h.old_status || null,
        new_status: h.new_status || '',
        comment: h.comment,
        changed_by_name: h.changed_by ? usersMap.get(h.changed_by) || null : null,
        created_at: h.created_at,
    }))

    return { items, hasMore: filtered.length > pageSize }
}
