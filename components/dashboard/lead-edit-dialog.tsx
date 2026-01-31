"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { LeadEditForm } from "@/components/forms/lead-edit-form"
import { Lead } from "@/types/app"
import { useRouter } from "next/navigation"

interface LeadEditDialogProps {
    lead: Lead | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LeadEditDialog({ lead, open, onOpenChange }: LeadEditDialogProps) {
    const router = useRouter()

    if (!lead) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[80vw] sm:max-w-[80vw] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border-l border-white/20 dark:border-white/10 shadow-2xl p-0">
                <div className="p-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Редактирование лида: {lead.name}</SheetTitle>
                        <SheetDescription>
                            Внесите изменения в данные лида и сохраните их.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="pb-8">
                        <LeadEditForm
                            lead={lead}
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
