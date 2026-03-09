"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { getColumns, type Client } from "./columns"
import { ClientEditDialog } from "@/components/dashboard/client-edit-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ClientsClientProps {
    data: any[]
    dealers: { id: string; name: string }[]
    createLink: string
}

export function ClientsClient({ data, dealers, createLink }: ClientsClientProps) {
    const [dealerFilter, setDealerFilter] = React.useState<string>("all")
    const [typeFilter, setTypeFilter] = React.useState<string>("all")
    const [companyFilter, setCompanyFilter] = React.useState<string>("all")
    const [editingClient, setEditingClient] = React.useState<Client | null>(null)

    const companies = React.useMemo(() => {
        const map = new Map<string, string>()
        data.forEach(client => {
            if (client.company_id && client.companies?.name) {
                map.set(client.company_id, client.companies.name)
            }
        })
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
    }, [data])

    const filteredData = React.useMemo(() => {
        return data.filter((client) => {
            const matchDealer = dealerFilter === "all" || client.tenants?.id === dealerFilter
            const matchType = typeFilter === "all" || client.client_type === typeFilter
            const matchCompany = companyFilter === "all" || client.company_id === companyFilter
            return matchDealer && matchType && matchCompany
        })
    }, [data, dealerFilter, typeFilter, companyFilter])

    const columns = React.useMemo(
        () => getColumns((client) => setEditingClient(client)),
        []
    )

    return (
        <>
            <DataTable
                columns={columns}
                data={filteredData}
                searchKey="name"
                createLink={createLink}
                createLabel="Добавить клиента"
                filters={
                    <div className="flex items-center gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[170px]">
                                <SelectValue placeholder="Тип клиента" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все типы</SelectItem>
                                <SelectItem value="person">Физ. лицо</SelectItem>
                                <SelectItem value="organization">Юр. лицо</SelectItem>
                            </SelectContent>
                        </Select>
                        {dealers.length > 1 && (
                            <Select value={dealerFilter} onValueChange={setDealerFilter}>
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
                        )}
                        {companies.length > 0 && (
                            <Select value={companyFilter} onValueChange={setCompanyFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Все компании" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все компании</SelectItem>
                                    {companies.map(([id, name]) => (
                                        <SelectItem key={id} value={id}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                }
            />

            <ClientEditDialog
                client={editingClient}
                open={!!editingClient}
                onOpenChange={(open) => !open && setEditingClient(null)}
                dealers={dealers}
            />
        </>
    )
}
