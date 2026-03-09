"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Search, X, Trash2, Eye, Phone, User, MapPin, Calendar } from "lucide-react"

interface DeletedLead {
    id: string
    original_lead_id: string
    lead_data: any
    deletion_reason: string
    deleted_by: string | null
    deleted_by_name: string | null
    deleted_at: string
}

interface DeletedLeadsClientProps {
    data: DeletedLead[]
}

export function DeletedLeadsClient({ data }: DeletedLeadsClientProps) {
    const [search, setSearch] = useState("")
    const [viewingLead, setViewingLead] = useState<DeletedLead | null>(null)

    const filtered = data.filter(d => {
        if (!search) return true
        const q = search.toLowerCase()
        const lead = d.lead_data
        return (
            lead.name?.toLowerCase().includes(q) ||
            lead.phone?.includes(q) ||
            d.deletion_reason.toLowerCase().includes(q)
        )
    })

    return (
        <div className="space-y-4">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Поиск по имени, телефону, причине..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Trash2 className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-lg">Нет удалённых лидов</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(d => {
                        const lead = d.lead_data
                        return (
                            <Card key={d.id} className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">{lead.name}</span>
                                            <span className="text-sm text-muted-foreground">{lead.phone}</span>
                                            {lead.city && (
                                                <Badge variant="outline" className="text-xs">
                                                    {lead.city}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <Badge variant="destructive" className="text-xs">
                                                {d.deletion_reason}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {d.deleted_by_name || "Неизвестно"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(d.deleted_at), "d MMM yyyy HH:mm", { locale: ru })}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => setViewingLead(d)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            <Dialog open={!!viewingLead} onOpenChange={open => !open && setViewingLead(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Удалённый лид</DialogTitle>
                    </DialogHeader>
                    {viewingLead && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Имя</span>
                                        <span className="font-medium flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            {viewingLead.lead_data.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Телефон</span>
                                        <span className="font-medium flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            {viewingLead.lead_data.phone}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Город</span>
                                        <span className="font-medium flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                            {viewingLead.lead_data.city || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Статус до удаления</span>
                                        <Badge variant="outline">{viewingLead.lead_data.status}</Badge>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Источник</span>
                                        <span>{viewingLead.lead_data.source || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Создан</span>
                                        <span>
                                            {viewingLead.lead_data.created_at
                                                ? format(new Date(viewingLead.lead_data.created_at), "d MMM yyyy HH:mm", { locale: ru })
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                                {viewingLead.lead_data.comment && (
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Комментарий</span>
                                        <p className="text-sm">{viewingLead.lead_data.comment}</p>
                                    </div>
                                )}
                                {viewingLead.lead_data.services?.length > 0 && (
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-0.5">Услуги</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {viewingLead.lead_data.services.map((s: string) => (
                                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                                <div className="text-sm font-medium text-destructive">Информация об удалении</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Причина</span>
                                        <span className="font-medium">{viewingLead.deletion_reason}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Удалил</span>
                                        <span>{viewingLead.deleted_by_name || "Неизвестно"}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground block text-xs">Дата удаления</span>
                                        <span>{format(new Date(viewingLead.deleted_at), "d MMMM yyyy, HH:mm:ss", { locale: ru })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
