"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { getColumns, type Company } from "./columns"
import { CompanyEditDialog } from "@/components/dashboard/company-edit-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface CompaniesClientProps {
    data: any[]
    dealers: { id: string; name: string }[]
    createLink: string
}

export function CompaniesClient({ data, dealers, createLink }: CompaniesClientProps) {
    const [selectedDealer, setSelectedDealer] = React.useState<string>("all")
    const [editingCompany, setEditingCompany] = React.useState<Company | null>(null)

    const filteredData = React.useMemo(() => {
        if (selectedDealer === "all") return data
        return data.filter((company) => company.tenants?.id === selectedDealer)
    }, [data, selectedDealer])

    const columns = React.useMemo(
        () => getColumns((company) => setEditingCompany(company)),
        []
    )

    return (
        <>
            <DataTable
                columns={columns}
                data={filteredData}
                searchKey="name"
                createLink={createLink}
                createLabel="Добавить компанию"
                filters={
                    dealers.length > 1 ? (
                        <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Все дилеры" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все дилеры</SelectItem>
                                {dealers.map((dealer) => (
                                    <SelectItem key={dealer.id} value={dealer.id}>
                                        {dealer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : undefined
                }
            />

            <CompanyEditDialog
                company={editingCompany}
                open={!!editingCompany}
                onOpenChange={(open) => !open && setEditingCompany(null)}
                dealers={dealers}
            />
        </>
    )
}
