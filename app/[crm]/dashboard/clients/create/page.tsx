import { createClient } from "@/lib/supabase/server"
import { ClientForm } from "@/components/forms/client-form"

export const dynamic = 'force-dynamic'

async function getData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { dealers: [], companies: [] }

    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    let dealersQuery = supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .eq('is_maan', false)
        .order('name')

    let companiesQuery = supabase
        .from('companies')
        .select('id, name, tenant_id')
        .order('name')

    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        dealersQuery = dealersQuery.eq('id', userDetails.tenant_id)
        companiesQuery = companiesQuery.eq('tenant_id', userDetails.tenant_id)
    }

    const [dealersRes, companiesRes] = await Promise.all([
        dealersQuery,
        companiesQuery
    ])

    return {
        dealers: dealersRes.data || [],
        companies: companiesRes.data || [],
    }
}

export default async function CreateClientPage() {
    const { dealers, companies } = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Новый клиент</h1>
                <p className="text-muted-foreground mt-1">Заполните данные клиента</p>
            </div>
            <ClientForm dealers={dealers} companies={companies} />
        </div>
    )
}
