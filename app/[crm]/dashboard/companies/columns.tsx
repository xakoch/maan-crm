"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { Button } from "@/components/ui/button"

export type Company = {
    id: string
    name: string
    inn: string | null
    address: string | null
    contact_person: string | null
    contact_phone: string | null
    contact_email: string | null
    tenant_id: string | null
    created_at: string
    tenants?: { id: string; name: string } | null
}

export function getColumns(onOpen: (company: Company) => void): ColumnDef<Company>[] {
    return [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Название
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
            accessorKey: "inn",
            header: "ИНН",
            cell: ({ row }) => row.original.inn || "—",
        },
        {
            accessorKey: "contact_person",
            header: "Контактное лицо",
            cell: ({ row }) => row.original.contact_person || "—",
        },
        {
            accessorKey: "contact_phone",
            header: "Телефон",
            cell: ({ row }) => row.original.contact_phone || "—",
        },
        {
            accessorKey: "tenants.name",
            header: "Дилер",
            cell: ({ row }) => row.original.tenants?.name || "—",
        },
        {
            accessorKey: "created_at",
            header: "Дата создания",
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
