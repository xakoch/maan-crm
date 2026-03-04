import { createClient } from "@/lib/supabase/server"
import { CompanyForm } from "@/components/forms/company-form"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export const dynamic = 'force-dynamic'

async function getData(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userDetails } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    const { data: company, error } = await supabase
        .from('companies')
        .select(`
            *,
            tenants:tenant_id (id, name)
        `)
        .eq('id', id)
        .single()

    if (error || !company) return null

    // Count clients linked to this company
    const { count: clientsCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', id)

    let dealersQuery = supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        dealersQuery = dealersQuery.eq('id', userDetails.tenant_id)
    }

    const { data: dealers } = await dealersQuery

    return {
        company,
        dealers: dealers || [],
        clientsCount: clientsCount || 0,
    }
}

interface CompanyPageProps {
    params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: CompanyPageProps) {
    const { id } = await params
    const result = await getData(id)

    if (!result) notFound()

    const { company, dealers, clientsCount } = result

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                <p className="text-muted-foreground mt-1">Редактирование компании</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Клиентов</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clientsCount}</div>
                    </CardContent>
                </Card>
            </div>

            <CompanyForm company={company} dealers={dealers} />
        </div>
    )
}
