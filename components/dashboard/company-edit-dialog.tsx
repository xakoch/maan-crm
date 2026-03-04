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
import { CompanyForm } from "@/components/forms/company-form"
import { useRouter } from "next/navigation"

interface CompanyEditDialogProps {
    company: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    dealers: { id: string; name: string }[]
}

export function CompanyEditDialog({ company, open, onOpenChange, dealers }: CompanyEditDialogProps) {
    const router = useRouter()

    if (!company) return null

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
                        <SheetTitle>Редактирование компании: {company.name}</SheetTitle>
                        <SheetDescription>
                            Внесите изменения в данные компании и сохраните их.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="pb-8">
                        <CompanyForm
                            company={company}
                            dealers={dealers}
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
