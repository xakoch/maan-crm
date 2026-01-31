import { createClient } from "./supabase/server";

export interface DashboardStats {
    total_leads: number;
    new_leads: number;
    closed_leads: number;
    conversion_rate: number;
    monthly_leads: { name: string; total: number }[];
    recent_leads: {
        id: string;
        name: string;
        email: string | null;
        total_value: number;
        status: string;
    }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();

    // Get current user and role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getEmptyStats(); // Should be handled by layout but good for safety

    const { data: profile } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();

    // Base query builder helper
    const applyFilter = (query: any) => {
        if (profile?.role !== 'super_admin' && profile?.tenant_id) {
            return query.eq('tenant_id', profile.tenant_id);
        }
        return query;
    };

    // 1. Total Leads
    const { count: totalLeads } = await applyFilter(supabase
        .from('leads')
        .select('*', { count: 'exact', head: true }));

    // 2. New Leads
    const { count: newLeads } = await applyFilter(supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new'));

    // 3. Closed Leads
    const { count: closedLeads } = await applyFilter(supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed'));

    // 4. Conversion Rate (Closed / Total * 100)
    const total = totalLeads || 0;
    const closed = closedLeads || 0;
    const conversionRate = total > 0 ? (closed / total) * 100 : 0;

    // 5. Monthly Leads (Group by month for current year)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    let leadsQuery = supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

    // Apply filter manually because applyFilter returns a modified query, simpler to just re-apply logic
    if (profile?.role !== 'super_admin' && profile?.tenant_id) {
        leadsQuery = leadsQuery.eq('tenant_id', profile.tenant_id);
    }

    const { data: leadsData } = await leadsQuery;

    const monthlyLeadsMap = new Map<string, number>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = months[d.getMonth()];
        monthlyLeadsMap.set(monthName, 0);
    }

    leadsData?.forEach(lead => {
        const date = new Date(lead.created_at);
        const monthName = months[date.getMonth()];
        if (monthlyLeadsMap.has(monthName)) {
            monthlyLeadsMap.set(monthName, (monthlyLeadsMap.get(monthName) || 0) + 1);
        }
    });

    const monthlyLeads = Array.from(monthlyLeadsMap.entries()).map(([name, total]) => ({ name, total }));


    // 6. Recent Leads (Recent Activity)
    let recentQuery = supabase
        .from('leads')
        .select('id, name, status, conversion_value')
        .order('created_at', { ascending: false })
        .limit(5);

    if (profile?.role !== 'super_admin' && profile?.tenant_id) {
        recentQuery = recentQuery.eq('tenant_id', profile.tenant_id);
    }

    const { data: recentLeadsData } = await recentQuery;

    const recent_leads = recentLeadsData?.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: null,
        total_value: lead.conversion_value || 0,
        status: lead.status
    })) || [];


    return {
        total_leads: totalLeads || 0,
        new_leads: newLeads || 0,
        closed_leads: closedLeads || 0,
        conversion_rate: Number(conversionRate.toFixed(1)),
        monthly_leads: monthlyLeads,
        recent_leads: recent_leads
    };
}

function getEmptyStats(): DashboardStats {
    return {
        total_leads: 0,
        new_leads: 0,
        closed_leads: 0,
        conversion_rate: 0,
        monthly_leads: [],
        recent_leads: []
    };
}
