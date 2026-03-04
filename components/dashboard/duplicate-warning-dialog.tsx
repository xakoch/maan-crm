"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { DuplicateLeadInfo } from "@/app/actions/check-duplicate"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

const STATUS_LABELS: Record<string, string> = {
    new: "Новый",
    processing: "В работе",
    closed: "Закрыт",
    rejected: "Отклонён",
}

interface DuplicateWarningDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    duplicate: DuplicateLeadInfo | null
    onConfirm: () => void
}

export function DuplicateWarningDialog({ open, onOpenChange, duplicate, onConfirm }: DuplicateWarningDialogProps) {
    if (!duplicate) return null

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Возможный дубль</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>Найден лид с таким же номером телефона:</p>
                            <div className="rounded-md border p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">{duplicate.name}</span>
                                    <Badge variant="outline">{STATUS_LABELS[duplicate.status] || duplicate.status}</Badge>
                                </div>
                                <div className="text-muted-foreground">{duplicate.phone}</div>
                                <div className="text-muted-foreground text-xs">
                                    Создан: {format(new Date(duplicate.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                                </div>
                            </div>
                            <p>Вы уверены, что хотите создать ещё один лид?</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Создать всё равно
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
