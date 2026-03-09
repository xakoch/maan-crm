import { createClient } from "@/lib/supabase/server"
import { ClientForm } from "@/components/forms/client-form"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

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

    const { data: client, error } = await supabase
        .from('clients')
        .select(`
            *,
            tenants:tenant_id (id, name),
            managers:assigned_manager_id (id, full_name),
            companies:company_id (id, name)
        `)
        .eq('id', id)
        .single()

    if (error || !client) return null

    // Fetch lead info if linked
    let lead = null
    if (client.lead_id) {
        const { data: leadData } = await supabase
            .from('leads')
            .select('id, name, phone, status, source, created_at')
            .eq('id', client.lead_id)
            .single()
        lead = leadData
    }

    let dealersQuery = supabase
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
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
        client,
        lead,
        dealers: dealersRes.data || [],
        companies: companiesRes.data || [],
    }
}

interface ClientPageProps {
    params: Promise<{ crm: string; id: string }>
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
    const { crm, id } = await params
    const result = await getData(id)

    if (!result) notFound()

    const { client, lead, dealers, companies } = result

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                    <Badge variant={client.client_type === 'organization' ? 'default' : 'secondary'}>
                        {client.client_type === 'organization' ? 'Юр. лицо' : 'Физ. лицо'}
                    </Badge>
                </div>
                <p className="text-muted-foreground mt-1">Редактирование клиента</p>
            </div>

            {lead && (
                <Card className="mb-6 border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Создан из лида
                            <Link
                                href={`/${crm}/dashboard/leads`}
                                className="text-blue-600 hover:underline dark:text-blue-400 inline-flex items-center gap-1"
                            >
                                Перейти к лиду <ExternalLink className="h-3 w-3" />
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Имя:</span>{" "}
                                <span className="font-medium">{lead.name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Телефон:</span>{" "}
                                <span className="font-medium">{lead.phone}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Источник:</span>{" "}
                                <span className="font-medium">{lead.source}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Статус:</span>{" "}
                                <Badge variant="outline">{lead.status}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <ClientForm client={client} dealers={dealers} companies={companies} />
        </div>
    )
}
