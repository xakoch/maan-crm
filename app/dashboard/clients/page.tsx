import { createClient } from "@/lib/supabase/server"
import { ClientsClient } from "./client"

export const dynamic = 'force-dynamic'

async function getData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { clients: [], dealers: [], managers: [], companies: [] }

    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    let clientsQuery = supabase
        .from('clients')
        .select(`
            *,
            tenants:tenant_id (id, name),
            managers:assigned_manager_id (id, full_name),
            companies:company_id (id, name)
        `)
        .order('created_at', { ascending: false })

    let dealersQuery = supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        clientsQuery = clientsQuery.eq('tenant_id', userDetails.tenant_id)
        dealersQuery = dealersQuery.eq('id', userDetails.tenant_id)
    }

    if (userDetails?.role === 'manager') {
        clientsQuery = clientsQuery.eq('assigned_manager_id', user.id)
    }

    const [clientsRes, dealersRes] = await Promise.all([
        clientsQuery,
        dealersQuery
    ])

    return {
        clients: clientsRes.data || [],
        dealers: dealersRes.data || [],
    }
}

export default async function ClientsPage() {
    const { clients, dealers } = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Клиенты</h1>
            </div>
            <ClientsClient data={clients} dealers={dealers} />
        </div>
    )
}
