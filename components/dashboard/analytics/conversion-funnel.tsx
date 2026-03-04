"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ArrowDown, Clock } from "lucide-react"
import type { FunnelDetails } from "@/lib/analytics"

interface ConversionFunnelProps {
    data: { new: number; processing: number; closed: number; rejected: number }
    details?: FunnelDetails
}

const STAGES = [
    { key: "new" as const, label: "Новые", color: "bg-blue-500", textColor: "text-blue-600" },
    { key: "processing" as const, label: "В работе", color: "bg-yellow-500", textColor: "text-yellow-600" },
    { key: "closed" as const, label: "Закрыты", color: "bg-green-500", textColor: "text-green-600" },
    { key: "rejected" as const, label: "Отклонены", color: "bg-red-500", textColor: "text-red-600" },
]

const TRANSITIONS = [
    { lossKey: "loss_new_to_processing" as const, avgKey: "avg_days_new_to_processing" as const },
    { lossKey: "loss_processing_to_closed" as const, avgKey: "avg_days_processing_to_closed" as const },
]

export function ConversionFunnel({ data, details }: ConversionFunnelProps) {
    const total = data.new + data.processing + data.closed + data.rejected

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Воронка конверсии</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-2">
                    {STAGES.map((stage, index) => {
                        const value = data[stage.key]
                        const percent = total > 0 ? Math.round((value / total) * 100) : 0
                        const transition = index < TRANSITIONS.length ? TRANSITIONS[index] : null
                        return (
                            <div key={stage.key} className="flex items-center gap-2 flex-1">
                                <div className="flex-1 text-center p-4 rounded-lg border bg-card">
                                    <div className={`text-3xl font-bold ${stage.textColor}`}>
                                        {value}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {stage.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {percent}%
                                    </div>
                                    <div className={`h-1 ${stage.color} rounded-full mt-2`}
                                        style={{ width: `${Math.max(percent, 5)}%`, margin: "0 auto" }}
                                    />
                                </div>
                                {index < STAGES.length - 1 && (
                                    <div className="flex flex-col items-center gap-1 shrink-0 min-w-[60px]">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        {details && transition && (
                                            <>
                                                <div className="text-xs font-medium text-red-500">
                                                    ↓{details[transition.lossKey]}%
                                                </div>
                                                {details[transition.avgKey] !== null && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {details[transition.avgKey]}д
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                {details?.avg_days_new_to_closed !== null && details?.avg_days_new_to_closed !== undefined && (
                    <div className="mt-4 pt-3 border-t text-center text-sm text-muted-foreground">
                        Среднее время до закрытия: <span className="font-medium text-foreground">{details.avg_days_new_to_closed} дней</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
