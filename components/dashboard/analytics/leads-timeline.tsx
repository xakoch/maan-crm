"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface LeadsTimelineProps {
    data: { date: string; count: number }[]
}

export function LeadsTimeline({ data }: LeadsTimelineProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Лиды по времени</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Нет данных
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Лиды по времени</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(v) => format(new Date(v), "d MMM", { locale: ru })}
                            className="text-xs"
                        />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <Tooltip
                            labelFormatter={(v) => format(new Date(v as string), "d MMMM yyyy", { locale: ru })}
                            formatter={(value: any) => [value, "Лиды"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.1}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
