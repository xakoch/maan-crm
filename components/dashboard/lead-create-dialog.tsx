"use client"

import { X } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet"
import { LeadCreateForm } from "@/components/forms/lead-create-form"
import { useRouter } from "next/navigation"

interface LeadCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LeadCreateDialog({ open, onOpenChange }: LeadCreateDialogProps) {
    const router = useRouter()

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
                        <SheetTitle>Создать новый лид</SheetTitle>
                        <SheetDescription>
                            Заполните форму для создания нового лида.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="pb-8">
                        <LeadCreateForm
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
