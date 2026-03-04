"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DeviceChartProps {
    data: { name: string; value: number; color: string }[]
}

const DEVICE_LABELS: Record<string, string> = {
    desktop: "Десктоп",
    mobile: "Мобильный",
    tablet: "Планшет",
    unknown: "Неизвестно",
}

export function DeviceChart({ data }: DeviceChartProps) {
    if (data.length === 0 || (data.length === 1 && data[0].name === "unknown")) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Устройства</CardTitle>
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
                <CardTitle className="text-base">Устройства</CardTitle>
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
                            label={(props: any) =>
                                `${DEVICE_LABELS[props.name] || props.name} ${(props.percent * 100).toFixed(0)}%`
                            }
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any, name: any) => [value, DEVICE_LABELS[name] || name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
