"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import Link from "next/link"

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

export type Manager = {
    id: string
    full_name: string
    email: string
    phone: string | null
    tenant_id: string | null
    telegram_username: string | null
    role: 'super_admin' | 'dealer' | 'manager'
    is_active: boolean
    created_at: string
    tenants?: {
        name: string
    } | null
}

export const columns: ColumnDef<Manager>[] = [
    {
        accessorKey: "full_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    ФИО
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "tenants.name",
        header: "Дилер",
        cell: ({ row }) => {
            const tenantName = row.original.tenants?.name
            return tenantName || "-"
        }
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "phone",
        header: "Телефон",
    },
    {
        accessorKey: "telegram_username",
        header: "Telegram",
        cell: ({ row }) => {
            const username = row.getValue("telegram_username") as string | null
            if (!username) return "-"
            return <a href={`https://t.me/${username}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">@{username}</a>
        }
    },
    {
        accessorKey: "is_active",
        header: "Статус",
        cell: ({ row }) => {
            const isActive = row.getValue("is_active") as boolean
            return (
                <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                    {isActive ? "Активен" : "Неактивен"}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const manager = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Открыть меню</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(manager.id)}
                        >
                            Скопировать ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href={`/dashboard/managers/${manager.id}`} className="w-full cursor-pointer">
                            <DropdownMenuItem className="cursor-pointer">
                                Редактировать
                            </DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
