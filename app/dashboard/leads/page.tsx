import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { LeadsClient } from "./client"
import { getPipelineStages } from "@/app/actions/settings"
import { stagesToKanbanColumns } from "@/lib/pipeline"

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200

async function getData(loadAll: boolean = false) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { leads: [], totalCount: 0 }
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

    // Apply filter if not super_admin
    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        query = query.eq('tenant_id', userDetails.tenant_id)
    }

    // Managers see only their own leads OR new leads (to pick up)
    if (userDetails?.role === 'manager') {
        query = query.or(`assigned_manager_id.eq.${user.id},status.eq.new`)
    }

    // Get total count via a separate count query
    let countQuery = supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })

    if (userDetails && userDetails.role !== 'super_admin' && userDetails.tenant_id) {
        countQuery = countQuery.eq('tenant_id', userDetails.tenant_id)
    }
    if (userDetails?.role === 'manager') {
        countQuery = countQuery.or(`assigned_manager_id.eq.${user.id},status.eq.new`)
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

    return { leads: data, totalCount }
}

interface LeadsPageProps {
    searchParams: Promise<{ all?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
    const params = await searchParams
    const loadAll = params.all === 'true'
    const [{ leads, totalCount }, stages] = await Promise.all([
        getData(loadAll),
        getPipelineStages('lumara'),
    ])
    const hasMore = !loadAll && totalCount > DEFAULT_LIMIT
    const columns = stagesToKanbanColumns(stages)

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Заявки (Лиды)</h1>
                <Link
                    href="/dashboard/leads/deleted"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Удалённые лиды
                </Link>
            </div>
            <LeadsClient data={leads} hasMore={hasMore} totalCount={totalCount} columns={columns} />
        </div>
    )
}
