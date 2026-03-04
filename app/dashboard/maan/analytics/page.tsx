import { getAnalyticsData, getComparisonData } from "@/lib/analytics"
import { AnalyticsContent } from "@/components/dashboard/analytics-content"
import { getMaanTenantId } from "@/lib/maan"

interface MaanAnalyticsPageProps {
    searchParams: Promise<{ from?: string; to?: string }>
}

export default async function MaanAnalyticsPage({ searchParams }: MaanAnalyticsPageProps) {
    const params = await searchParams
    const maanTenantId = await getMaanTenantId()

    const to = params.to || new Date().toISOString().slice(0, 10)
    const defaultFrom = new Date()
    defaultFrom.setDate(defaultFrom.getDate() - 30)
    const from = params.from || defaultFrom.toISOString().slice(0, 10)

    const dateFrom = `${from}T00:00:00.000Z`
    const dateTo = `${to}T23:59:59.999Z`

    const [data, comparison] = await Promise.all([
        getAnalyticsData(dateFrom, dateTo, maanTenantId),
        getComparisonData(dateFrom, dateTo, maanTenantId),
    ])

    return <AnalyticsContent data={data} from={from} to={to} comparison={comparison} />
}
