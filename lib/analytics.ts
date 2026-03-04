import { createClient } from "./supabase/server"

export interface FunnelDetails {
    loss_new_to_processing: number
    loss_processing_to_closed: number
    avg_days_new_to_processing: number | null
    avg_days_processing_to_closed: number | null
    avg_days_new_to_closed: number | null
}

export interface AnalyticsData {
    source_distribution: { name: string; value: number; color: string }[]
    leads_over_time: { date: string; count: number }[]
    funnel: { new: number; processing: number; closed: number; rejected: number }
    funnel_details: FunnelDetails
    source_conversion: { source: string; total: number; closed: number; rate: number }[]
    geo_distribution: { city: string; count: number }[]
    manager_leaderboard: {
        id: string
        name: string
        total: number
        closed: number
        rate: number
        avg_close_days: number | null
    }[]
    utm_campaigns: {
        campaign: string
        source: string
        medium: string
        leads: number
        closed: number
        rate: number
    }[]
    device_breakdown: { name: string; value: number; color: string }[]
}

const SOURCE_COLORS: Record<string, string> = {
    website: "#3b82f6",
    instagram: "#e1306c",
    facebook: "#1877f2",
    manual: "#8b5cf6",
    google: "#34a853",
    telegram: "#0088cc",
    "maan-form": "#f97316",
    other: "#6b7280",
}

const DEVICE_COLORS: Record<string, string> = {
    desktop: "#3b82f6",
    mobile: "#10b981",
    tablet: "#f59e0b",
    unknown: "#6b7280",
}

export async function getAnalyticsData(dateFrom: string, dateTo: string, tenantId?: string): Promise<AnalyticsData> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return getEmptyAnalytics()

    const { data: profile } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single()

    // Fetch all leads in date range with role-based filtering
    let query = supabase
        .from("leads")
        .select("*")
        .gte("created_at", dateFrom)
        .lte("created_at", dateTo)

    if (tenantId) {
        // If tenantId is explicitly passed (e.g. MAAN analytics), filter by it
        query = query.eq("tenant_id", tenantId)
    } else if (profile?.role !== "super_admin" && profile?.tenant_id) {
        query = query.eq("tenant_id", profile.tenant_id)
    }
    if (!tenantId && profile?.role === "manager") {
        query = query.eq("assigned_manager_id", user.id)
    }

    const { data: leads } = await query
    if (!leads || leads.length === 0) return getEmptyAnalytics()

    // Fetch managers for leaderboard names
    const managerIds = [...new Set(leads.map(l => l.assigned_manager_id).filter((id): id is string => id !== null))]
    let managersMap = new Map<string, string>()
    if (managerIds.length > 0) {
        const { data: managers } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", managerIds)
        managers?.forEach(m => managersMap.set(m.id, m.full_name))
    }

    // Fetch lead_history for funnel details
    const leadIds = leads.map(l => l.id)
    let allHistory: any[] = []
    // Supabase .in() has a limit, batch if needed
    const batchSize = 100
    for (let i = 0; i < leadIds.length; i += batchSize) {
        const batch = leadIds.slice(i, i + batchSize)
        const { data: historyBatch } = await supabase
            .from('lead_history')
            .select('lead_id, new_status, created_at')
            .in('lead_id', batch)
            .order('created_at', { ascending: true })
        if (historyBatch) allHistory = allHistory.concat(historyBatch)
    }

    // Build per-lead status transition timeline
    const historyMap = new Map<string, { status: string; date: string }[]>()
    allHistory.forEach(h => {
        if (!historyMap.has(h.lead_id)) historyMap.set(h.lead_id, [])
        historyMap.get(h.lead_id)!.push({ status: h.new_status, date: h.created_at })
    })

    // Calculate funnel losses and timing
    const daysNewToProcessing: number[] = []
    const daysProcessingToClosed: number[] = []
    const daysNewToClosed: number[] = []
    let reachedProcessing = 0
    let reachedClosed = 0

    leads.forEach(l => {
        const history = historyMap.get(l.id) || []
        const newEntry = history.find(h => h.status === 'new')
        const processingEntry = history.find(h => h.status === 'processing')
        const closedEntry = history.find(h => h.status === 'closed')

        const newDate = newEntry?.date || l.created_at

        if (processingEntry) {
            reachedProcessing++
            const days = Math.ceil(
                (new Date(processingEntry.date).getTime() - new Date(newDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            daysNewToProcessing.push(Math.max(days, 0))
        }

        if (closedEntry) {
            reachedClosed++
            if (processingEntry) {
                const days = Math.ceil(
                    (new Date(closedEntry.date).getTime() - new Date(processingEntry.date).getTime()) / (1000 * 60 * 60 * 24)
                )
                daysProcessingToClosed.push(Math.max(days, 0))
            }
            const days = Math.ceil(
                (new Date(closedEntry.date).getTime() - new Date(newDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            daysNewToClosed.push(Math.max(days, 0))
        }
    })

    const totalLeadsCount = leads.length
    const lossNewToProcessing = totalLeadsCount > 0
        ? Math.round(((totalLeadsCount - reachedProcessing) / totalLeadsCount) * 100)
        : 0
    const lossProcessingToClosed = reachedProcessing > 0
        ? Math.round(((reachedProcessing - reachedClosed) / reachedProcessing) * 100)
        : 0

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null

    const funnel_details: FunnelDetails = {
        loss_new_to_processing: lossNewToProcessing,
        loss_processing_to_closed: lossProcessingToClosed,
        avg_days_new_to_processing: avg(daysNewToProcessing),
        avg_days_processing_to_closed: avg(daysProcessingToClosed),
        avg_days_new_to_closed: avg(daysNewToClosed),
    }

    // 1. Source distribution
    const sourceMap = new Map<string, number>()
    leads.forEach(l => {
        const src = l.source || "other"
        sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
    })
    const source_distribution = Array.from(sourceMap.entries())
        .map(([name, value]) => ({ name, value, color: SOURCE_COLORS[name] || SOURCE_COLORS.other }))
        .sort((a, b) => b.value - a.value)

    // 2. Leads over time (by day)
    const dayMap = new Map<string, number>()
    leads.forEach(l => {
        const day = l.created_at.slice(0, 10)
        dayMap.set(day, (dayMap.get(day) || 0) + 1)
    })
    const leads_over_time = Array.from(dayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

    // 3. Funnel
    const funnel = { new: 0, processing: 0, closed: 0, rejected: 0 }
    leads.forEach(l => {
        if (l.status in funnel) funnel[l.status as keyof typeof funnel]++
    })

    // 4. Source conversion
    const sourceConvMap = new Map<string, { total: number; closed: number }>()
    leads.forEach(l => {
        const src = l.source || "other"
        const entry = sourceConvMap.get(src) || { total: 0, closed: 0 }
        entry.total++
        if (l.status === "closed") entry.closed++
        sourceConvMap.set(src, entry)
    })
    const source_conversion = Array.from(sourceConvMap.entries())
        .map(([source, { total, closed }]) => ({
            source,
            total,
            closed,
            rate: total > 0 ? Math.round((closed / total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)

    // 5. Geo distribution
    const geoMap = new Map<string, number>()
    leads.forEach(l => {
        const city = l.city || "Неизвестно"
        geoMap.set(city, (geoMap.get(city) || 0) + 1)
    })
    const geo_distribution = Array.from(geoMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)

    // 6. Manager leaderboard
    const mgrMap = new Map<string, { total: number; closed: number; closeDays: number[] }>()
    leads.forEach(l => {
        if (!l.assigned_manager_id) return
        const entry = mgrMap.get(l.assigned_manager_id) || { total: 0, closed: 0, closeDays: [] }
        entry.total++
        if (l.status === "closed") {
            entry.closed++
            if (l.closed_at) {
                const days = Math.ceil(
                    (new Date(l.closed_at).getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)
                )
                entry.closeDays.push(days)
            }
        }
        mgrMap.set(l.assigned_manager_id, entry)
    })
    const manager_leaderboard = Array.from(mgrMap.entries())
        .map(([id, { total, closed, closeDays }]) => ({
            id,
            name: managersMap.get(id) || "Неизвестный",
            total,
            closed,
            rate: total > 0 ? Math.round((closed / total) * 100) : 0,
            avg_close_days: closeDays.length > 0
                ? Math.round(closeDays.reduce((a, b) => a + b, 0) / closeDays.length)
                : null,
        }))
        .sort((a, b) => b.closed - a.closed)

    // 7. UTM campaigns
    const utmMap = new Map<string, { source: string; medium: string; leads: number; closed: number }>()
    leads.forEach(l => {
        if (!l.utm_campaign) return
        const key = l.utm_campaign
        const entry = utmMap.get(key) || { source: l.utm_source || "", medium: l.utm_medium || "", leads: 0, closed: 0 }
        entry.leads++
        if (l.status === "closed") entry.closed++
        utmMap.set(key, entry)
    })
    const utm_campaigns = Array.from(utmMap.entries())
        .map(([campaign, data]) => ({
            campaign,
            ...data,
            rate: data.leads > 0 ? Math.round((data.closed / data.leads) * 100) : 0,
        }))
        .sort((a, b) => b.leads - a.leads)

    // 8. Device breakdown
    const deviceMap = new Map<string, number>()
    leads.forEach(l => {
        const device = l.device_type || "unknown"
        deviceMap.set(device, (deviceMap.get(device) || 0) + 1)
    })
    const device_breakdown = Array.from(deviceMap.entries())
        .map(([name, value]) => ({ name, value, color: DEVICE_COLORS[name] || DEVICE_COLORS.unknown }))
        .sort((a, b) => b.value - a.value)

    return {
        source_distribution,
        leads_over_time,
        funnel,
        funnel_details,
        source_conversion,
        geo_distribution,
        manager_leaderboard,
        utm_campaigns,
        device_breakdown,
    }
}

export interface ComparisonMetric {
    current: number
    previous: number
    changePercent: number
}

export interface ComparisonData {
    total_leads: ComparisonMetric
    new_leads: ComparisonMetric
    closed_leads: ComparisonMetric
    conversion_rate: ComparisonMetric
}

export async function getComparisonData(dateFrom: string, dateTo: string, tenantId?: string): Promise<ComparisonData> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return getEmptyComparison()

    const { data: profile } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single()

    // Calculate previous period of same length
    const fromDate = new Date(dateFrom)
    const toDate = new Date(dateTo)
    const periodMs = toDate.getTime() - fromDate.getTime()
    const prevTo = new Date(fromDate.getTime() - 1) // day before current period
    const prevFrom = new Date(prevTo.getTime() - periodMs)

    const prevDateFrom = prevFrom.toISOString()
    const prevDateTo = prevTo.toISOString()

    // Fetch current and previous period leads
    async function fetchLeads(from: string, to: string) {
        let query = supabase
            .from("leads")
            .select("status")
            .gte("created_at", from)
            .lte("created_at", to)

        if (tenantId) {
            query = query.eq("tenant_id", tenantId)
        } else if (profile?.role !== "super_admin" && profile?.tenant_id) {
            query = query.eq("tenant_id", profile.tenant_id)
        }
        if (!tenantId && profile?.role === "manager") {
            query = query.eq("assigned_manager_id", user!.id)
        }

        const { data } = await query
        return data || []
    }

    const [currentLeads, previousLeads] = await Promise.all([
        fetchLeads(dateFrom, dateTo),
        fetchLeads(prevDateFrom, prevDateTo),
    ])

    function calcMetrics(leads: { status: string }[]) {
        const total = leads.length
        const newCount = leads.filter(l => l.status === 'new').length
        const closed = leads.filter(l => l.status === 'closed').length
        const rate = total > 0 ? Math.round((closed / total) * 100) : 0
        return { total, newCount, closed, rate }
    }

    const curr = calcMetrics(currentLeads)
    const prev = calcMetrics(previousLeads)

    function changePercent(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    return {
        total_leads: { current: curr.total, previous: prev.total, changePercent: changePercent(curr.total, prev.total) },
        new_leads: { current: curr.newCount, previous: prev.newCount, changePercent: changePercent(curr.newCount, prev.newCount) },
        closed_leads: { current: curr.closed, previous: prev.closed, changePercent: changePercent(curr.closed, prev.closed) },
        conversion_rate: { current: curr.rate, previous: prev.rate, changePercent: changePercent(curr.rate, prev.rate) },
    }
}

function getEmptyComparison(): ComparisonData {
    const zero: ComparisonMetric = { current: 0, previous: 0, changePercent: 0 }
    return { total_leads: zero, new_leads: zero, closed_leads: zero, conversion_rate: zero }
}

function getEmptyAnalytics(): AnalyticsData {
    return {
        source_distribution: [],
        leads_over_time: [],
        funnel: { new: 0, processing: 0, closed: 0, rejected: 0 },
        funnel_details: {
            loss_new_to_processing: 0,
            loss_processing_to_closed: 0,
            avg_days_new_to_processing: null,
            avg_days_processing_to_closed: null,
            avg_days_new_to_closed: null,
        },
        source_conversion: [],
        geo_distribution: [],
        manager_leaderboard: [],
        utm_campaigns: [],
        device_breakdown: [],
    }
}
