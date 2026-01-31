"use client"

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
import Link from "next/link"
import { Database } from "@/types/database.types"

type Dealer = Database['public']['Tables']['tenants']['Row']

export const columns: ColumnDef<Dealer>[] = [
    {
        accessorKey: "name",
        header: "Название",
        cell: ({ row }) => {
            const dealer = row.original
            return (
                <Link
                    href={`/dashboard/dealers/${dealer.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    {dealer.name}
                </Link>
            )
        }
    },
    {
        accessorKey: "city",
        header: "Город",
    },
    {
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === 'active' ? 'default' : 'destructive'}>
                    {status === 'active' ? 'Активен' : 'Неактивен'}
                </Badge>
            )
        },
    },
    {
        accessorKey: "owner_name",
        header: "Владелец",
    },
    {
        accessorKey: "owner_phone",
        header: "Телефон",
    },
    {
        accessorKey: "created_at",
        header: "Создан",
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"))
            return <div>{format(date, "d MMM yyyy", { locale: ru })}</div>
        },
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => {
            const dealer = row.original

            return (
                <div className="text-right">
                    <Link href={`/dashboard/dealers/${dealer.id}`}>
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
