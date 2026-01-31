"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cities } from "@/lib/uzbekistan-regions"

interface DealerFiltersProps {
    cityFilter: string
    statusFilter: string
    onCityChange: (value: string) => void
    onStatusChange: (value: string) => void
}

export function DealerFilters({
    cityFilter,
    statusFilter,
    onCityChange,
    onStatusChange,
}: DealerFiltersProps) {
    return (
        <>
            <Select value={cityFilter} onValueChange={onCityChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Все города" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Все города</SelectItem>
                    {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                            {city}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                </SelectContent>
            </Select>
        </>
    )
}
