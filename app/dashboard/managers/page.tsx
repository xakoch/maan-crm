import { createClient } from "@/lib/supabase/server"
import { ManagersClient } from "./client"

async function getData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { managers: [], dealers: [] }

    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    // Base queries
    let managersQuery = supabase
        .from('users')
        .select(`
            id,
            full_name,
            email,
            phone,
            role,
            is_active,
            telegram_id,
            telegram_username,
            created_at,
            tenants:tenant_id (id, name)
        `)
        .eq('role', 'manager')
        .order('created_at', { ascending: false })

    let dealersQuery = supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

    // Apply tenancy filters
    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        managersQuery = managersQuery.eq('tenant_id', userDetails.tenant_id)
        // Dealers list should only contain their own tenant
        dealersQuery = dealersQuery.eq('id', userDetails.tenant_id)
    }

    const [managersRes, dealersRes] = await Promise.all([
        managersQuery,
        dealersQuery
    ])

    if (managersRes.error) {
        console.error('Error fetching managers:', managersRes.error.message)
    }

    if (dealersRes.error) {
        console.error('Error fetching dealers:', dealersRes.error.message)
    }

    return {
        managers: managersRes.data || [],
        dealers: dealersRes.data || []
    }
}

export default async function ManagersPage() {
    const { managers, dealers } = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Менеджеры</h1>
            </div>
            <ManagersClient data={managers} dealers={dealers} />
        </div>
    )
}
