"use client"

import { X } from "lucide-react"
import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet"
import { ClientForm } from "@/components/forms/client-form"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ClientEditDialogProps {
    client: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    dealers: { id: string; name: string }[]
}

export function ClientEditDialog({ client, open, onOpenChange, dealers }: ClientEditDialogProps) {
    const router = useRouter()
    const [companies, setCompanies] = useState<{ id: string; name: string; tenant_id?: string | null }[]>([])

    useEffect(() => {
        async function fetchCompanies() {
            if (!open) return
            const supabase = createClient()
            const { data } = await supabase
                .from('companies')
                .select('id, name, tenant_id')
                .order('name')
            if (data) setCompanies(data)
        }
        fetchCompanies()
    }, [open])

    if (!client) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                showCloseButton={false}
                className="w-[80vw] sm:max-w-[80vw] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border-l border-white/20 dark:border-white/10 shadow-2xl p-0"
            >
                <SheetClose className="absolute right-6 top-6 z-50 rounded-full bg-orange-500 p-2 text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                    <X className="h-6 w-6" />
                </SheetClose>
                <div className="p-6">
                    <SheetHeader className="mb-6 mr-12">
                        <SheetTitle>Редактирование клиента: {client.name}</SheetTitle>
                        <SheetDescription>
                            Внесите изменения в данные клиента и сохраните их.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="pb-8">
                        <ClientForm
                            client={client}
                            dealers={dealers}
                            companies={companies}
                            onSuccess={() => {
                                onOpenChange(false)
                                router.refresh()
                            }}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
