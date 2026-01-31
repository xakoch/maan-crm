"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, MapPin, Phone, Building2, User, Calendar } from "lucide-react"

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
    region: string | null
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
                    className="flex items-center gap-2 font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    <User className="h-3 w-3 text-muted-foreground" />
                    {lead.name}
                </Link>
            )
        }
    },
    {
        accessorKey: "phone",
        header: "Телефон",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {row.original.phone}
            </div>
        )
    },
    {
        id: "location",
        header: "Локация",
        cell: ({ row }) => {
            const lead = row.original;
            return (
                <div className="flex flex-col text-sm">
                    <span className="font-medium flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {lead.city}
                    </span>
                    {lead.region && (
                        <span className="text-xs text-muted-foreground pl-5">{lead.region}</span>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "tenants.name",
        header: "Дилер",
        cell: ({ row }) => {
            // Access nested data safely
            const tenant = row.original.tenants
            return tenant ? (
                <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {tenant.name}
                </div>
            ) : <span className="text-muted-foreground">-</span>
        }
    },
    {
        accessorKey: "managers.full_name",
        header: "Менеджер",
        cell: ({ row }) => {
            const manager = row.original.managers
            return manager ? (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {manager.full_name}
                </div>
            ) : <span className="text-muted-foreground">Не назначен</span>
        }
    },
    {
        accessorKey: "created_at",
        header: "Дата",
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return (
                <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(date, "d MMM HH:mm", { locale: ru })}
                </div>
            )
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
