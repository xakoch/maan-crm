"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LeadsKanban } from "@/components/dashboard/leads-kanban"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X, CheckSquare } from "lucide-react"
import { LeadCreateDialog } from "@/components/dashboard/lead-create-dialog"
import { bulkUpdateLeads } from "./actions"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const SOURCE_LABELS: Record<string, string> = {
    website: "Сайт",
    instagram: "Instagram",
    facebook: "Facebook",
    manual: "Вручную",
    google: "Google",
    telegram: "Telegram",
    "maan-form": "MAAN форма",
    other: "Другое",
}

interface LeadsClientProps {
    data: any[]
    hasMore?: boolean
    totalCount?: number
}

export function LeadsClient({ data, hasMore, totalCount }: LeadsClientProps) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [sourceFilter, setSourceFilter] = React.useState<string>("all")
    const [cityFilter, setCityFilter] = React.useState<string>("all")
    const [dealerFilter, setDealerFilter] = React.useState<string>("all")
    const [managerFilter, setManagerFilter] = React.useState<string>("all")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [selectionMode, setSelectionMode] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const [bulkStatus, setBulkStatus] = React.useState<string>("")
    const [bulkManager, setBulkManager] = React.useState<string>("")
    const [isBulkUpdating, setIsBulkUpdating] = React.useState(false)

    const handleSelectLead = React.useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const handleBulkUpdate = React.useCallback(async () => {
        if (selectedIds.size === 0) return
        const updates: { status?: any; assigned_manager_id?: string } = {}
        if (bulkStatus) updates.status = bulkStatus
        if (bulkManager) updates.assigned_manager_id = bulkManager
        if (!updates.status && !updates.assigned_manager_id) {
            toast.error("Выберите статус или менеджера")
            return
        }
        setIsBulkUpdating(true)
        try {
            const result = await bulkUpdateLeads(Array.from(selectedIds), updates)
            if (!result.success) throw new Error(result.error)
            toast.success(`Обновлено: ${result.updatedCount} лидов`)
            setSelectedIds(new Set())
            setSelectionMode(false)
            setBulkStatus("")
            setBulkManager("")
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка массового обновления")
        } finally {
            setIsBulkUpdating(false)
        }
    }, [selectedIds, bulkStatus, bulkManager])

    // Extract unique sources from data
    const sources = React.useMemo(() => {
        const unique = new Set(data.map(lead => lead.source).filter(Boolean))
        return Array.from(unique).sort()
    }, [data])

    // Extract unique cities from lead's own city field
    const cities = React.useMemo(() => {
        const unique = new Set(data.map(lead => lead.city).filter(Boolean))
        return Array.from(unique).sort()
    }, [data])

    // Extract unique dealers (tenant names)
    const dealers = React.useMemo(() => {
        const unique = new Set(data.map(lead => lead.tenants?.name).filter(Boolean))
        return Array.from(unique).sort()
    }, [data])

    // Extract unique managers
    const managers = React.useMemo(() => {
        const map = new Map<string, string>()
        data.forEach(lead => {
            if (lead.assigned_manager_id && lead.managers?.full_name) {
                map.set(lead.assigned_manager_id, lead.managers.full_name)
            }
        })
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
    }, [data])

    const filteredData = React.useMemo(() => {
        return data.filter((lead) => {
            const matchSearch = !searchQuery || (() => {
                const q = searchQuery.toLowerCase()
                const nameMatch = lead.name?.toLowerCase().includes(q)
                const phoneDigits = lead.phone?.replace(/\D/g, "") || ""
                const queryDigits = q.replace(/\D/g, "")
                const phoneMatch = queryDigits ? phoneDigits.includes(queryDigits) : false
                return nameMatch || phoneMatch
            })()
            const matchSource = sourceFilter === "all" || lead.source === sourceFilter
            const matchCity = cityFilter === "all" || lead.city === cityFilter
            const matchDealer = dealerFilter === "all" || lead.tenants?.name === dealerFilter
            const matchManager = managerFilter === "all" || lead.assigned_manager_id === managerFilter
            return matchSearch && matchSource && matchCity && matchDealer && matchManager
        })
    }, [data, searchQuery, sourceFilter, cityFilter, dealerFilter, managerFilter])

    return (
        <div className="space-y-4">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Поиск по имени или телефону..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
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
                            {sources.map((source) => (
                                <SelectItem key={source} value={source}>
                                    {SOURCE_LABELS[source] || source}
                                </SelectItem>
                            ))}
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
                            {cities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={dealerFilter}
                        onValueChange={setDealerFilter}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Дилер" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все дилеры</SelectItem>
                            {dealers.map((dealer) => (
                                <SelectItem key={dealer} value={dealer}>{dealer}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={managerFilter}
                        onValueChange={setManagerFilter}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Менеджер" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все менеджеры</SelectItem>
                            {managers.map(([id, name]) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant={selectionMode ? "default" : "outline"}
                        onClick={() => {
                            setSelectionMode(!selectionMode)
                            if (selectionMode) {
                                setSelectedIds(new Set())
                                setBulkStatus("")
                                setBulkManager("")
                            }
                        }}
                        className="w-full md:w-auto"
                    >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        {selectionMode ? "Отменить выбор" : "Выбрать"}
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Добавить лид
                    </Button>
                </div>
            </div>

            <LeadsKanban
                initialLeads={filteredData}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelectLead={handleSelectLead}
            />

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            const url = new URL(window.location.href)
                            url.searchParams.set('all', 'true')
                            window.location.href = url.toString()
                        }}
                    >
                        Загрузить все ({totalCount})
                    </Button>
                </div>
            )}

            {selectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium whitespace-nowrap">
                        Выбрано: {selectedIds.size}
                    </span>
                    <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">Новый</SelectItem>
                            <SelectItem value="processing">В работе</SelectItem>
                            <SelectItem value="closed">Закрыт</SelectItem>
                            <SelectItem value="rejected">Отклонён</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={bulkManager} onValueChange={setBulkManager}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Менеджер" />
                        </SelectTrigger>
                        <SelectContent>
                            {managers.map(([id, name]) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleBulkUpdate} disabled={isBulkUpdating}>
                        {isBulkUpdating ? "Обновление..." : "Применить"}
                    </Button>
                </div>
            )}

            <LeadCreateDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    )
}
