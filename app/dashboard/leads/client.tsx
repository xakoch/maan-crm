"use client"

import * as React from "react"
import { LeadsKanban } from "@/components/dashboard/leads-kanban"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { LeadCreateDialog } from "@/components/dashboard/lead-create-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface LeadsClientProps {
    data: any[]
}

export function LeadsClient({ data }: LeadsClientProps) {
    const [sourceFilter, setSourceFilter] = React.useState<string>("all")
    const [cityFilter, setCityFilter] = React.useState<string>("all")
    const [regionFilter, setRegionFilter] = React.useState<string>("all")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

    // Extract unique cities from data
    const cities = React.useMemo(() => {
        const unique = new Set(data.map(lead => lead.tenants?.city).filter(Boolean))
        return Array.from(unique)
    }, [data])

    // Extract unique regions, dependent on selected city
    const regions = React.useMemo(() => {
        const relevantData = cityFilter === "all"
            ? data
            : data.filter(lead => lead.tenants?.city === cityFilter)

        const unique = new Set(relevantData.map(lead => lead.tenants?.region).filter(Boolean))
        return Array.from(unique)
    }, [data, cityFilter])

    // Reset region when city changes
    React.useEffect(() => {
        if (cityFilter !== "all" && regionFilter !== "all") {
            // Optional: check if current region belongs to new city?
            // For simplicity, let's keep it, or reset if not in list.
            // But usually UX is better if we just reset or keep valid.
            // Let's check validity:
            const validRegions = new Set(data
                .filter(lead => lead.tenants?.city === cityFilter)
                .map(l => l.tenants?.region))

            if (!validRegions.has(regionFilter)) {
                setRegionFilter("all")
            }
        }
    }, [cityFilter, regionFilter, data])


    const filteredData = React.useMemo(() => {
        return data.filter((lead) => {
            const matchSource = sourceFilter === "all" || lead.source === sourceFilter
            const matchCity = cityFilter === "all" || lead.tenants?.city === cityFilter
            const matchRegion = regionFilter === "all" || lead.tenants?.region === regionFilter
            return matchSource && matchCity && matchRegion
        })
    }, [data, sourceFilter, cityFilter, regionFilter])

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Select
                        value={sourceFilter}
                        onValueChange={setSourceFilter}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Источник" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все источники</SelectItem>
                            <SelectItem value="website">Сайт</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="manual">Вручную</SelectItem>
                            <SelectItem value="other">Другое</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={cityFilter}
                        onValueChange={setCityFilter}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Город" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все города</SelectItem>
                            {cities.map((city: any) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={regionFilter}
                        onValueChange={setRegionFilter}
                        disabled={regions.length === 0}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Район" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все районы</SelectItem>
                            {regions.map((region: any) => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Добавить лид
                </Button>
            </div>

            <LeadsKanban initialLeads={filteredData} />

            <LeadCreateDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    )
}
