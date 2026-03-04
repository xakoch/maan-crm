"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type Client = {
    id: string
    name: string
    phone: string | null
    email: string | null
    client_type: 'person' | 'organization'
    city: string | null
    region: string | null
    total_deal_value: number
    created_at: string
    tenants?: { id: string; name: string } | null
    managers?: { id: string; full_name: string } | null
    companies?: { id: string; name: string } | null
}

export function getColumns(onOpen: (client: Client) => void): ColumnDef<Client>[] {
    return [
        {
            accessorKey: "client_type",
            header: "Тип",
            cell: ({ row }) => {
                const type = row.original.client_type
                return (
                    <Badge variant={type === 'organization' ? 'default' : 'secondary'}>
                        {type === 'organization' ? 'Юр.' : 'Физ.'}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Имя
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <button
                    onClick={() => onOpen(row.original)}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400 text-left"
                >
                    {row.original.name}
                </button>
            ),
        },
        {
            accessorKey: "phone",
            header: "Телефон",
            cell: ({ row }) => row.original.phone || "—",
        },
        {
            accessorKey: "city",
            header: "Город",
            cell: ({ row }) => row.original.city || "—",
        },
        {
            accessorKey: "companies.name",
            header: "Компания",
            cell: ({ row }) => {
                const company = row.original.companies
                if (!company) return "—"
                return <span className="font-medium">{company.name}</span>
            },
        },
        {
            accessorKey: "managers.full_name",
            header: "Менеджер",
            cell: ({ row }) => row.original.managers?.full_name || "—",
        },
        {
            accessorKey: "total_deal_value",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Сумма сделки
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const value = row.original.total_deal_value
                if (!value) return "—"
                return new Intl.NumberFormat('ru-RU').format(value) + ' сум'
            },
        },
        {
            accessorKey: "created_at",
            header: "Дата",
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at"))
                return format(date, "d MMM yyyy", { locale: ru })
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="text-right">
                    <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                        onClick={() => onOpen(row.original)}
                    >
                        Открыть
                    </Button>
                </div>
            ),
        },
    ]
}
