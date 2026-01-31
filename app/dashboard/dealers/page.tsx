import { createClient } from "@/lib/supabase/server"
import { DealersTable } from "@/components/dashboard/dealers-table"

async function getDealers() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    let query = supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    // Apply filter if not super_admin
    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        query = query.eq('id', userDetails.tenant_id)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching dealers:', error.message)
        return []
    }

    return data
}

export default async function DealersPage() {
    const data = await getDealers()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Дилеры</h1>
            </div>
            <DealersTable data={data} />
        </div>
    )
}
