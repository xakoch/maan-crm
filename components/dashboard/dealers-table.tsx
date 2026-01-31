"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/app/dashboard/dealers/columns"
import { DealerFilters } from "./dealer-filters"
import { Database } from "@/types/database.types"

type Dealer = Database['public']['Tables']['tenants']['Row']

interface DealersTableProps {
    data: Dealer[]
}

export function DealersTable({ data }: DealersTableProps) {
    const [cityFilter, setCityFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    const filteredData = useMemo(() => {
        return data.filter((dealer) => {
            const matchesCity = cityFilter === "all" || dealer.city === cityFilter
            const matchesStatus = statusFilter === "all" || dealer.status === statusFilter
            return matchesCity && matchesStatus
        })
    }, [data, cityFilter, statusFilter])

    return (
        <DataTable
            columns={columns}
            data={filteredData}
            searchKey="name"
            createLink="/dashboard/dealers/create"
            createLabel="Добавить дилера"
            filters={
                <DealerFilters
                    cityFilter={cityFilter}
                    statusFilter={statusFilter}
                    onCityChange={setCityFilter}
                    onStatusChange={setStatusFilter}
                />
            }
        />
    )
}
