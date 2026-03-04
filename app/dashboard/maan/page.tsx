import { createClient } from "@/lib/supabase/server"
import { getMaanTenantId } from "@/lib/maan"
import { MaanLeadsClient } from "./client"

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200

async function getData(loadAll: boolean = false) {
    const supabase = await createClient()
    const maanTenantId = await getMaanTenantId()

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

    return { leads: data, totalCount }
}

interface MaanLeadsPageProps {
    searchParams: Promise<{ all?: string }>
}

export default async function MaanLeadsPage({ searchParams }: MaanLeadsPageProps) {
    const params = await searchParams
    const loadAll = params.all === 'true'
    const { leads, totalCount } = await getData(loadAll)
    const hasMore = !loadAll && totalCount > DEFAULT_LIMIT

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">MAAN - Заявки</h1>
            </div>
            <MaanLeadsClient data={leads} hasMore={hasMore} totalCount={totalCount} />
        </div>
    )
}
