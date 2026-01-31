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
    telegram_id: number | null
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
        cell: ({ row }) => {
            const manager = row.original
            return (
                <Link
                    href={`/dashboard/managers/${manager.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    {manager.full_name}
                </Link>
            )
        }
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
        accessorKey: "id",
        header: "Link ID",
        cell: ({ row }) => {
            const id = row.original.id
            const shortId = id.substring(id.length - 6).toUpperCase()
            return (
                <Badge variant="outline" className="font-mono">
                    {shortId}
                </Badge>
            )
        }
    },
    {
        accessorKey: "telegram_username",
        header: "Telegram",
        cell: ({ row }) => {
            const username = row.getValue("telegram_username") as string | null
            const telegramId = row.original.telegram_id

            if (!username && !telegramId) {
                return <Badge variant="outline" className="text-muted-foreground">Не привязан</Badge>
            }

            if (telegramId) {
                return (
                    <div className="flex flex-col gap-1">
                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 w-fit">
                            Привязан
                        </Badge>
                        {username && (
                            <a href={`https://t.me/${username}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                                @{username}
                            </a>
                        )}
                    </div>
                )
            }

            return (
                <a href={`https://t.me/${username}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    @{username}
                </a>
            )
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
        header: "",
        cell: ({ row }) => {
            const manager = row.original

            return (
                <div className="text-right">
                    <Link href={`/dashboard/managers/${manager.id}`}>
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
