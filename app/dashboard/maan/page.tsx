import { createClient } from "@/lib/supabase/server"
import { getMaanTenantId } from "@/lib/maan"
import { MaanLeadsClient } from "./client"
import { getPipelineStages } from "@/app/actions/settings"
import { stagesToKanbanColumns } from "@/lib/pipeline"

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200

async function getData(loadAll: boolean = false) {
    const supabase = await createClient()
    const maanTenantId = await getMaanTenantId()
    const { data: { user } } = await supabase.auth.getUser()

    // Check user role
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id || '')
        .single()

    const isManager = userProfile?.role === 'manager'

    // Get total count
    const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', maanTenantId)

    const totalCount = count || 0

    let query = supabase
        .from('leads')
        .select(`
            *,
            tenants:tenant_id (name),
            managers:assigned_manager_id (full_name)
        `)
        .eq('tenant_id', maanTenantId)
        .order('created_at', { ascending: false })

    if (!loadAll) {
        query = query.limit(DEFAULT_LIMIT)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching MAAN leads:', error.message)
        return { leads: [], totalCount: 0 }
    }

    // For managers: show unassigned leads + their own leads
    // For admins/super_admin: show all leads
    let filteredLeads = data || []
    if (isManager && user) {
        filteredLeads = filteredLeads.filter(lead =>
            !lead.assigned_manager_id || lead.assigned_manager_id === user.id
        )
    }

    return { leads: filteredLeads, totalCount }
}

interface MaanLeadsPageProps {
    searchParams: Promise<{ all?: string }>
}

export default async function MaanLeadsPage({ searchParams }: MaanLeadsPageProps) {
    const params = await searchParams
    const loadAll = params.all === 'true'
    const [{ leads, totalCount }, stages] = await Promise.all([
        getData(loadAll),
        getPipelineStages('maan'),
    ])
    const hasMore = !loadAll && totalCount > DEFAULT_LIMIT
    const columns = stagesToKanbanColumns(stages)

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">MAAN - Заявки</h1>
            </div>
            <MaanLeadsClient data={leads} hasMore={hasMore} totalCount={totalCount} columns={columns} />
        </div>
    )
}
