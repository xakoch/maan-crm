import { createClient } from "@/lib/supabase/server"
import { CompaniesClient } from "./client"

export const dynamic = 'force-dynamic'

async function getData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { companies: [], dealers: [] }

    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    let companiesQuery = supabase
        .from('companies')
        .select(`
            *,
            tenants:tenant_id (id, name)
        `)
        .order('created_at', { ascending: false })

    let dealersQuery = supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .eq('is_maan', false)
        .order('name')

    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        companiesQuery = companiesQuery.eq('tenant_id', userDetails.tenant_id)
        dealersQuery = dealersQuery.eq('id', userDetails.tenant_id)
    }

    const [companiesRes, dealersRes] = await Promise.all([
        companiesQuery,
        dealersQuery
    ])

    return {
        companies: companiesRes.data || [],
        dealers: dealersRes.data || []
    }
}

export default async function CompaniesPage({ params }: { params: Promise<{ crm: string }> }) {
    const { crm } = await params;
    const { companies, dealers } = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Компании</h1>
            </div>
            <CompaniesClient data={companies} dealers={dealers} createLink={`/${crm}/dashboard/companies/create`} />
        </div>
    )
}
