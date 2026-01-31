"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
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
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [sourceFilter, setSourceFilter] = React.useState<string>("all")

    const filteredData = React.useMemo(() => {
        return data.filter((lead) => {
            const statusMatch = statusFilter === "all" || lead.status === statusFilter
            const sourceMatch = sourceFilter === "all" || lead.source === sourceFilter
            return statusMatch && sourceMatch
        })
    }, [data, statusFilter, sourceFilter])

    return (
        <DataTable
            columns={columns}
            data={filteredData}
            searchKey="name"
            createLink="/dashboard/leads/create"
            createLabel="Добавить лид"
            filters={
                <div className="flex gap-2">
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            <SelectItem value="new">Новый</SelectItem>
                            <SelectItem value="processing">В работе</SelectItem>
                            <SelectItem value="closed">Закрыт</SelectItem>
                            <SelectItem value="rejected">Отклонен</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={sourceFilter}
                        onValueChange={setSourceFilter}
                    >
                        <SelectTrigger className="w-[180px]">
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
                </div>
            }
        />
    )
}
