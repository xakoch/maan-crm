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

    // 1. Total Leads
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    // 2. New Leads (this month or just status 'new', let's use status 'new' for now)
    const { count: newLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

    // 3. Closed Leads
    const { count: closedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed');

    // 4. Conversion Rate (Closed / Total * 100)
    const total = totalLeads || 0;
    const closed = closedLeads || 0;
    const conversionRate = total > 0 ? (closed / total) * 100 : 0;

    // 5. Monthly Leads (Group by month for current year)
    // Supabase JS doesn't support complex aggregation easily without RPC or Views.
    // For now, let's fetch leads for the last 6 months and aggregate in JS.
    // This is not optimal for large datasets but fine for MVP.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const { data: leadsData } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

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
    const { data: recentLeadsData } = await supabase
        .from('leads')
        .select('id, name, status, conversion_value')
        .order('created_at', { ascending: false })
        .limit(5);

    const recent_leads = recentLeadsData?.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: null, // Lead table doesn't have email usually, maybe add phone?
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
