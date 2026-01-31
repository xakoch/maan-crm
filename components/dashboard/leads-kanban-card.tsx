"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User, Phone } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Database } from "@/types/database.types"

// Inline type to avoid import issues
type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}

interface LeadCardProps {
    lead: Lead
    isOverlay?: boolean
    onClick?: () => void
}

export function LeadCard({ lead, isOverlay, onClick }: LeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lead.id,
        data: {
            type: "Lead",
            lead,
        },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 p-4 border-2 border-dashed border-primary/50 rounded-lg h-[150px] bg-muted/50"
            />
        )
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                "group relative cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4",
                isOverlay ? "rotate-2 scale-105 shadow-xl cursor-grabbing z-50 border-primary" : "border-l-transparent hover:border-l-primary/50",
                "bg-card text-card-foreground"
            )}
        >
            <CardHeader className="p-2 space-y-0 pb-1">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-sm font-medium truncate leading-tight">
                        {lead.name}
                    </CardTitle>
                    {lead.source && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0 opacity-70">
                            {lead.source}
                        </Badge>
                    )}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    {lead.phone}
                </div>
            </CardHeader>
            <CardContent className="p-2 pt-1 space-y-1.5">
                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[150px]">
                            {lead.city} {lead.region ? `, ${lead.region}` : ''}
                        </span>
                    </div>
                    {lead.managers?.full_name && (
                        <div className="flex items-center gap-1.5 text-primary/80">
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[150px]">{lead.managers.full_name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>
                            {format(new Date(lead.created_at), 'd MMM HH:mm', { locale: ru })}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
