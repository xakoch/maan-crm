"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

// Define a type that includes the joined fields
type Lead = {
    id: string
    name: string
    phone: string
    city: string
    status: string | null
    created_at: string
    tenants: { name: string } | null
    managers: { full_name: string } | null
    source?: string | null
}

export const columns: ColumnDef<Lead>[] = [
    {
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => {
            const status = row.getValue("status") as string

            let variant: "default" | "secondary" | "destructive" | "outline" = "default"
            let label = status
            let className = ""

            switch (status) {
                case 'new':
                    variant = "default"
                    label = "Новый"
                    className = "bg-blue-500 hover:bg-blue-600 border-transparent text-white"
                    break
                case 'processing':
                    variant = "secondary"
                    label = "В работе"
                    className = "bg-yellow-500 hover:bg-yellow-600 border-transparent text-white"
                    break
                case 'closed':
                    variant = "outline"
                    label = "Закрыт"
                    className = "bg-green-500 hover:bg-green-600 border-transparent text-white"
                    break
                case 'rejected':
                    variant = "destructive"
                    label = "Отклонен"
                    break
            }

            return <Badge variant={variant} className={className}>{label}</Badge>
        },
    },
    {
        accessorKey: "name",
        header: "Имя",
        cell: ({ row }) => {
            const lead = row.original
            return (
                <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    {lead.name}
                </Link>
            )
        }
    },
    {
        accessorKey: "phone",
        header: "Телефон",
    },
    {
        accessorKey: "tenants.name",
        header: "Дилер",
        cell: ({ row }) => {
            // Access nested data safely
            const tenant = row.original.tenants
            return tenant ? tenant.name : <span className="text-muted-foreground">-</span>
        }
    },
    {
        accessorKey: "managers.full_name",
        header: "Менеджер",
        cell: ({ row }) => {
            const manager = row.original.managers
            return manager ? manager.full_name : <span className="text-muted-foreground">Не назначен</span>
        }
    },
    {
        accessorKey: "created_at",
        header: "Дата",
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return <div>{format(date, "d MMM HH:mm", { locale: ru })}</div>
        },
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => {
            const lead = row.original

            return (
                <div className="text-right">
                    <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                        >
                            Открыть
                        </Button>
                    </Link>
                </div>
            )
        },
    },
]
