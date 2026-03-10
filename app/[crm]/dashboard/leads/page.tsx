import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { LeadsClient } from "./client"
import { getPipelineStages } from "@/app/actions/settings"
import { stagesToKanbanColumns } from "@/lib/pipeline"
import { getMaanTenantId } from "@/lib/maan"
import { CrmType } from "@/lib/crm-context"

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200

async function getData(crm: CrmType, loadAll: boolean = false) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { leads: [], totalCount: 0, userRole: null }
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

    // Count query
    let countQuery = supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })

    if (crm === 'maan') {
        // MAAN: filter by MAAN tenant
        const maanTenantId = await getMaanTenantId()
        query = query.eq('tenant_id', maanTenantId)
        countQuery = countQuery.eq('tenant_id', maanTenantId)
    } else {
        // Lumara: existing tenant-based filtering
        if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
            query = query.eq('tenant_id', userDetails.tenant_id)
            countQuery = countQuery.eq('tenant_id', userDetails.tenant_id)
        }

        // Managers see only their own leads OR new leads (to pick up)
        if (userDetails?.role === 'manager') {
            query = query.or(`assigned_manager_id.eq.${user.id},status.eq.new`)
            countQuery = countQuery.or(`assigned_manager_id.eq.${user.id},status.eq.new`)
        }
    }

    const { count } = await countQuery
    const totalCount = count || 0

    if (!loadAll) {
        query = query.limit(DEFAULT_LIMIT)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching leads:', error.message)
        return { leads: [], totalCount: 0 }
    }

    // For MAAN managers: filter client-side
    let leads = data || []
    if (crm === 'maan' && userDetails?.role === 'manager' && user) {
        leads = leads.filter(lead =>
            !lead.assigned_manager_id || lead.assigned_manager_id === user.id
        )
    }

    return { leads, totalCount, userRole: userDetails?.role || null }
}

interface LeadsPageProps {
    params: Promise<{ crm: string }>
    searchParams: Promise<{ all?: string }>
}

export default async function LeadsPage({ params, searchParams }: LeadsPageProps) {
    const { crm } = await params
    const crmType = crm as CrmType
    const sp = await searchParams
    const loadAll = sp.all === 'true'
    const [{ leads, totalCount, userRole }, stages] = await Promise.all([
        getData(crmType, loadAll),
        getPipelineStages(crmType),
    ])
    const hasMore = !loadAll && totalCount > DEFAULT_LIMIT
    const columns = stagesToKanbanColumns(stages)

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    {crm === 'maan' ? 'MAAN - Заявки' : 'Заявки (Лиды)'}
                </h1>
                <Link
                    href={`/${crm}/dashboard/leads/deleted`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Удалённые лиды
                </Link>
            </div>
            <LeadsClient data={leads} hasMore={hasMore} totalCount={totalCount} columns={columns} userRole={userRole} />
        </div>
    )
}
