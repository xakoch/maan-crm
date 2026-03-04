"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SourceConversionChartProps {
    data: { source: string; total: number; closed: number; rate: number }[]
}

const SOURCE_LABELS: Record<string, string> = {
    website: "Сайт",
    instagram: "Instagram",
    facebook: "Facebook",
    manual: "Ручной",
    google: "Google",
    telegram: "Telegram",
    other: "Другое",
}

export function SourceConversionChart({ data }: SourceConversionChartProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Конверсия по источникам</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Нет данных
                </CardContent>
            </Card>
        )
    }

    const chartData = data.map(d => ({
        ...d,
        label: SOURCE_LABELS[d.source] || d.source,
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Конверсия по источникам</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="label" className="text-xs" />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <Tooltip
                            formatter={(value: any, name: any) => {
                                const labels: Record<string, string> = {
                                    total: "Всего",
                                    closed: "Закрыто",
                                }
                                return [value, labels[name] || name]
                            }}
                        />
                        <Legend formatter={(value) => {
                            const labels: Record<string, string> = {
                                total: "Всего лидов",
                                closed: "Закрыто",
                            }
                            return labels[value] || value
                        }} />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="closed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
