"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ManagerLeaderboardProps {
    data: {
        id: string
        name: string
        total: number
        closed: number
        rate: number
        avg_close_days: number | null
    }[]
}

export function ManagerLeaderboard({ data }: ManagerLeaderboardProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Рейтинг менеджеров</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Нет данных
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Рейтинг менеджеров</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">#</th>
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Менеджер</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Лиды</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Закрыто</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Конверсия</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ср. дней</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((mgr, i) => (
                                <tr key={mgr.id} className="border-b last:border-0">
                                    <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                                    <td className="py-3 px-2 font-medium">{mgr.name}</td>
                                    <td className="py-3 px-2 text-right">{mgr.total}</td>
                                    <td className="py-3 px-2 text-right text-green-600 font-medium">{mgr.closed}</td>
                                    <td className="py-3 px-2 text-right">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            mgr.rate >= 50 ? "bg-green-100 text-green-700" :
                                            mgr.rate >= 25 ? "bg-yellow-100 text-yellow-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {mgr.rate}%
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-right text-muted-foreground">
                                        {mgr.avg_close_days !== null ? `${mgr.avg_close_days} д.` : "—"}
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
