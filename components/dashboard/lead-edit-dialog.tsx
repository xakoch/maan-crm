"use client"

import { X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet"
import { LeadEditForm } from "@/components/forms/lead-edit-form"
import { Lead } from "@/types/app"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface LeadEditDialogProps {
    lead: Lead | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LeadEditDialog({ lead, open, onOpenChange }: LeadEditDialogProps) {
    const router = useRouter()
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        async function fetchHistory() {
            if (!lead?.id || !open) {
                setHistory([])
                return
            }
            setLoadingHistory(true)
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('lead_history')
                    .select('*, users(full_name)')
                    .eq('lead_id', lead.id)
                    .order('created_at', { ascending: false })

                if (!error && data) {
                    setHistory(data)
                }
            } catch (e) {
                console.error('Error fetching history:', e)
            } finally {
                setLoadingHistory(false)
            }
        }
        fetchHistory()
    }, [lead?.id, open])

    if (!lead) return null

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
                    <SheetHeader className="mb-6 mr-12"> {/* mr-12 to avoid overlap with close button */}
                        <SheetTitle>Редактирование лида: {lead.name}</SheetTitle>
                        <SheetDescription>
                            Внесите изменения в данные лида и сохраните их.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="pb-8">
                        <LeadEditForm
                            lead={lead}
                            history={history}
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
