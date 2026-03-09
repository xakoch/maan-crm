import { getAnalyticsData, getComparisonData } from "@/lib/analytics"
import { AnalyticsContent } from "@/components/dashboard/analytics-content"

interface AnalyticsPageProps {
    params: Promise<{ crm: string }>
    searchParams: Promise<{ from?: string; to?: string }>
}

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
    const { crm } = await params
    const sp = await searchParams

    const to = sp.to || new Date().toISOString().slice(0, 10)
    const defaultFrom = new Date()
    defaultFrom.setDate(defaultFrom.getDate() - 30)
    const from = sp.from || defaultFrom.toISOString().slice(0, 10)

    // Add time to include full days
    const dateFrom = `${from}T00:00:00.000Z`
    const dateTo = `${to}T23:59:59.999Z`

    // For MAAN CRM, filter by MAAN tenant
    let tenantId: string | undefined
    if (crm === 'maan') {
        const { getMaanTenantId } = await import("@/lib/maan")
        tenantId = await getMaanTenantId()
    }

    const [data, comparison] = await Promise.all([
        getAnalyticsData(dateFrom, dateTo, tenantId),
        getComparisonData(dateFrom, dateTo, tenantId),
    ])

    return <AnalyticsContent data={data} from={from} to={to} comparison={comparison} />
}
