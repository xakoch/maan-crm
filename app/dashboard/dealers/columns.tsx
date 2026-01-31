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
        cell: ({ row }) => {
            const dealer = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(dealer.id)}
                        >
                            Скопировать ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href={`/dashboard/dealers/${dealer.id}`} className="w-full cursor-pointer">
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
