"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Key } from "lucide-react"
import { DealerCredentialsDialog } from "@/components/dashboard/dealer-credentials-dialog"
import { Database } from "@/types/database.types"
import Link from "next/link"

type Dealer = Database['public']['Tables']['tenants']['Row']

export function DealerActionsCell({ dealer }: { dealer: Dealer }) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <div className="flex items-center justify-end gap-2">
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                onClick={() => setDialogOpen(true)}
                title="Управление доступом (Логин/Пароль)"
            >
                <Key className="h-4 w-4" />
            </Button>

            <Link href={`/dashboard/dealers/${dealer.id}`}>
                <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors h-8"
                >
                    Открыть
                </Button>
            </Link>

            <DealerCredentialsDialog
                dealer={dealer}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    )
}
