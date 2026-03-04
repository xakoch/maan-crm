"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GeoChartProps {
    data: { city: string; count: number }[]
}

export function GeoChart({ data }: GeoChartProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">География лидов</CardTitle>
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
                <CardTitle className="text-base">География лидов</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" allowDecimals={false} className="text-xs" />
                        <YAxis type="category" dataKey="city" width={150} className="text-xs" />
                        <Tooltip formatter={(value: any) => [value, "Лиды"]} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
