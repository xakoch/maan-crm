"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useState } from "react"

interface DateRangePickerProps {
    from: string
    to: string
}

const PRESETS = [
    { label: "7 дней", days: 7 },
    { label: "30 дней", days: 30 },
    { label: "90 дней", days: 90 },
    { label: "Год", days: 365 },
]

export function DateRangePicker({ from, to }: DateRangePickerProps) {
    const router = useRouter()
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: new Date(from),
        to: new Date(to),
    })

    const navigate = (fromDate: Date, toDate: Date) => {
        const params = new URLSearchParams()
        params.set("from", fromDate.toISOString().slice(0, 10))
        params.set("to", toDate.toISOString().slice(0, 10))
        router.push(`/dashboard/analytics?${params.toString()}`)
    }

    const handlePreset = (days: number) => {
        const toDate = new Date()
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        navigate(fromDate, toDate)
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
                <Button
                    key={preset.days}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(preset.days)}
                >
                    {preset.label}
                </Button>
            ))}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(from), "d MMM", { locale: ru })} — {format(new Date(to), "d MMM yyyy", { locale: ru })}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                    <div className="flex gap-4">
                        <div>
                            <p className="text-sm font-medium mb-2">От</p>
                            <Calendar
                                mode="single"
                                selected={dateRange.from}
                                onSelect={(date) => {
                                    if (date) setDateRange(prev => ({ ...prev, from: date }))
                                }}
                                locale={ru}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">До</p>
                            <Calendar
                                mode="single"
                                selected={dateRange.to}
                                onSelect={(date) => {
                                    if (date) setDateRange(prev => ({ ...prev, to: date }))
                                }}
                                locale={ru}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            size="sm"
                            onClick={() => {
                                navigate(dateRange.from, dateRange.to)
                                setCalendarOpen(false)
                            }}
                        >
                            Применить
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
