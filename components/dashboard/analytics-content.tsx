"use client"

import { type AnalyticsData, type ComparisonData, type ComparisonMetric } from "@/lib/analytics"
import { DateRangePicker } from "./analytics/date-range-picker"
import { SourceChart } from "./analytics/source-chart"
import { LeadsTimeline } from "./analytics/leads-timeline"
import { ConversionFunnel } from "./analytics/conversion-funnel"
import { SourceConversionChart } from "./analytics/source-conversion-chart"
import { GeoChart } from "./analytics/geo-chart"
import { ManagerLeaderboard } from "./analytics/manager-leaderboard"
import { UtmTable } from "./analytics/utm-table"
import { DeviceChart } from "./analytics/device-chart"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateCSV, downloadCSV } from "@/lib/export-csv"

interface AnalyticsContentProps {
    data: AnalyticsData
    from: string
    to: string
    comparison?: ComparisonData
}

function ComparisonCard({ title, metric, suffix }: { title: string; metric: ComparisonMetric; suffix?: string }) {
    const isUp = metric.changePercent > 0
    const isDown = metric.changePercent < 0
    const isNeutral = metric.changePercent === 0

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">{title}</div>
                <div className="text-2xl font-bold mt-1">
                    {metric.current}{suffix}
                </div>
                <div className="flex items-center gap-1 mt-1">
                    {isUp && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {isDown && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {isNeutral && <Minus className="h-4 w-4 text-muted-foreground" />}
                    <span className={cn(
                        "text-sm font-medium",
                        isUp && "text-green-500",
                        isDown && "text-red-500",
                        isNeutral && "text-muted-foreground"
                    )}>
                        {isUp ? "+" : ""}{metric.changePercent}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                        vs {metric.previous}{suffix}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

export function AnalyticsContent({ data, from, to, comparison }: AnalyticsContentProps) {
    const totalLeads = data.funnel.new + data.funnel.processing + data.funnel.closed + data.funnel.rejected

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Аналитика</h2>
                    <p className="text-muted-foreground">
                        Всего лидов за период: {totalLeads}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const sourceRows = data.source_conversion.map(s => ({
                                source: s.source,
                                total: s.total,
                                closed: s.closed,
                                rate: s.rate,
                            }))
                            const managerRows = data.manager_leaderboard.map(m => ({
                                name: m.name,
                                total: m.total,
                                closed: m.closed,
                                rate: m.rate,
                                avg_days: m.avg_close_days ?? 0,
                            }))
                            const csv1 = generateCSV(sourceRows, [
                                { key: "source", label: "Источник" },
                                { key: "total", label: "Всего" },
                                { key: "closed", label: "Закрыто" },
                                { key: "rate", label: "Конверсия %" },
                            ])
                            const csv2 = generateCSV(managerRows, [
                                { key: "name", label: "Менеджер" },
                                { key: "total", label: "Всего" },
                                { key: "closed", label: "Закрыто" },
                                { key: "rate", label: "Конверсия %" },
                                { key: "avg_days", label: "Ср. дней до закрытия" },
                            ])
                            const combined = csv1 + "\r\n\r\nМенеджеры\r\n" + csv2.replace("\uFEFF", "")
                            downloadCSV(combined, `analytics_${from}_${to}.csv`)
                        }}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Экспорт CSV
                    </Button>
                    <DateRangePicker from={from} to={to} />
                </div>
            </div>

            {comparison && (
                <div className="grid gap-4 md:grid-cols-4">
                    <ComparisonCard title="Всего лидов" metric={comparison.total_leads} />
                    <ComparisonCard title="Новые" metric={comparison.new_leads} />
                    <ComparisonCard title="Закрытые" metric={comparison.closed_leads} />
                    <ComparisonCard title="Конверсия" metric={comparison.conversion_rate} suffix="%" />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <SourceChart data={data.source_distribution} />
                <LeadsTimeline data={data.leads_over_time} />
            </div>

            <ConversionFunnel data={data.funnel} details={data.funnel_details} />

            <div className="grid gap-6 md:grid-cols-2">
                <SourceConversionChart data={data.source_conversion} />
                <GeoChart data={data.geo_distribution} />
            </div>

            <ManagerLeaderboard data={data.manager_leaderboard} />

            <UtmTable data={data.utm_campaigns} />

            <div className="grid gap-6 md:grid-cols-2">
                <DeviceChart data={data.device_breakdown} />
            </div>
        </div>
    )
}
