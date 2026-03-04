"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UtmTableProps {
    data: {
        campaign: string
        source: string
        medium: string
        leads: number
        closed: number
        rate: number
    }[]
}

export function UtmTable({ data }: UtmTableProps) {
    if (data.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">UTM-кампании</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Кампания</th>
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Источник</th>
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Канал</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Лиды</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Закрыто</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Конверсия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.campaign} className="border-b last:border-0">
                                    <td className="py-3 px-2 font-medium">{row.campaign}</td>
                                    <td className="py-3 px-2 text-muted-foreground">{row.source || "—"}</td>
                                    <td className="py-3 px-2 text-muted-foreground">{row.medium || "—"}</td>
                                    <td className="py-3 px-2 text-right">{row.leads}</td>
                                    <td className="py-3 px-2 text-right text-green-600 font-medium">{row.closed}</td>
                                    <td className="py-3 px-2 text-right">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            row.rate >= 50 ? "bg-green-100 text-green-700" :
                                            row.rate >= 25 ? "bg-yellow-100 text-yellow-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {row.rate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
