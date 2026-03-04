"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SourceChartProps {
    data: { name: string; value: number; color: string }[]
}

const SOURCE_LABELS: Record<string, string> = {
    website: "Сайт",
    instagram: "Instagram",
    facebook: "Facebook",
    manual: "Ручной ввод",
    google: "Google",
    telegram: "Telegram",
    other: "Другое",
}

export function SourceChart({ data }: SourceChartProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Источники лидов</CardTitle>
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
                <CardTitle className="text-base">Источники лидов</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={(props: any) =>
                                `${SOURCE_LABELS[props.name] || props.name} ${(props.percent * 100).toFixed(0)}%`
                            }
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any, name: any) => [value, SOURCE_LABELS[name] || name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
