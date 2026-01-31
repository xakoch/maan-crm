import { createClient } from "@/lib/supabase/server"
import { LeadsClient } from "./client"

export const dynamic = 'force-dynamic'

async function getData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Get user details to check role and tenant
    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    let query = supabase
        .from('leads')
        .select(`
            *,
            tenants:tenant_id (name),
            managers:assigned_manager_id (full_name)
        `)
        .order('created_at', { ascending: false })

    // Apply filter if not super_admin
    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        query = query.eq('tenant_id', userDetails.tenant_id)
    }

    // Managers see only their own leads OR new leads (to pick up)
    if (userDetails?.role === 'manager') {
        query = query.or(`assigned_manager_id.eq.${user.id},status.eq.new`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching leads:', error.message)
        return []
    }

    return data
}

export default async function LeadsPage() {
    const data = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Заявки (Лиды)</h1>
            </div>
            <LeadsClient data={data} />
        </div>
    )
}
