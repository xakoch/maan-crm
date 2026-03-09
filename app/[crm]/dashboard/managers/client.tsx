"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ManagersClientProps {
    data: any[]
    dealers: { id: string, name: string }[]
    createLink: string
}

export function ManagersClient({ data, dealers, createLink }: ManagersClientProps) {
    const params = useParams()
    const crm = params.crm as string
    const columns = React.useMemo(() => getColumns(crm), [crm])
    const [selectedDealer, setSelectedDealer] = React.useState<string>("all")

    const filteredData = React.useMemo(() => {
        if (selectedDealer === "all") return data
        return data.filter((manager) => manager.tenants?.id === selectedDealer)
    }, [data, selectedDealer])

    return (
        <DataTable
            columns={columns}
            data={filteredData}
            searchKey="full_name"
            createLink={createLink}
            createLabel="Добавить менеджера"
            filters={
                <Select
                    value={selectedDealer}
                    onValueChange={setSelectedDealer}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Все филиалы" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все филиалы</SelectItem>
                        {dealers.map((dealer) => (
                            <SelectItem key={dealer.id} value={dealer.id}>
                                {dealer.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            }
        />
    )
}
