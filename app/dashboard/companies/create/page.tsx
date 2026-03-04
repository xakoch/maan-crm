import { createClient } from "@/lib/supabase/server"
import { CompanyForm } from "@/components/forms/company-form"

export const dynamic = 'force-dynamic'

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
        .select('id, name')
        .eq('status', 'active')
        .order('name')

    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        query = query.eq('id', userDetails.tenant_id)
    }

    const { data } = await query
    return data || []
}

export default async function CreateCompanyPage() {
    const dealers = await getDealers()

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Новая компания</h1>
                <p className="text-muted-foreground mt-1">Заполните данные компании</p>
            </div>
            <CompanyForm dealers={dealers} />
        </div>
    )
}
