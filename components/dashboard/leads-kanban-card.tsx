"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, Phone, Building2, Globe, Instagram, Facebook, Laptop, HelpCircle, Tag, HandMetal } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Database } from "@/types/database.types"
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
import { useState } from "react"

// Inline type to avoid import issues
type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}

interface LeadCardProps {
    lead: Lead
    isOverlay?: boolean
    onClick?: () => void
    selectionMode?: boolean
    selected?: boolean
    onSelect?: (id: string) => void
    onClaim?: (id: string) => void
}

const getSourceIcon = (source: string) => {
    switch (source) {
        case 'instagram': return <Instagram className="w-2.5 h-2.5 mr-1" />;
        case 'facebook': return <Facebook className="w-2.5 h-2.5 mr-1" />;
        case 'website': return <Globe className="w-2.5 h-2.5 mr-1" />;
        case 'manual': return <Laptop className="w-2.5 h-2.5 mr-1" />;
        default: return <HelpCircle className="w-2.5 h-2.5 mr-1" />;
    }
}

export function LeadCard({ lead, isOverlay, onClick, selectionMode, selected, onSelect, onClaim }: LeadCardProps) {
    const [claimDialogOpen, setClaimDialogOpen] = useState(false)
    const [isClaiming, setIsClaiming] = useState(false)

    const handleClaimConfirm = async () => {
        if (!onClaim) return
        setIsClaiming(true)
        onClaim(lead.id)
    }

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
            {...(selectionMode ? {} : listeners)}
            onClick={selectionMode ? () => onSelect?.(lead.id) : onClick}
            className={cn(
                "group relative hover:shadow-md transition-all border-l-4",
                selectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
                isOverlay ? "rotate-2 scale-105 shadow-xl cursor-grabbing z-50 border-primary" : "border-l-transparent hover:border-l-primary/50",
                selected && "ring-2 ring-primary bg-primary/5",
                "bg-card text-card-foreground"
            )}
        >
            <CardHeader className="p-2 space-y-0 pb-1">
                <div className="flex justify-between items-start gap-2">
                    {selectionMode && (
                        <div className={cn(
                            "w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                            selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                        )}>
                            {selected && (
                                <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                    <CardTitle className="text-sm font-medium truncate leading-tight">
                        {lead.name}
                    </CardTitle>
                    {lead.source && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0 opacity-70 flex items-center">
                            {getSourceIcon(lead.source)}
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
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[150px] font-medium">
                                {lead.city}
                            </span>
                        </div>
                        {lead.region && (
                            <div className="pl-4 text-[10px] opacity-80 truncate max-w-[150px]">
                                {lead.region}
                            </div>
                        )}
                    </div>
                    {lead.tenants?.name && (
                        <div className="flex items-center gap-1.5 text-muted-foreground/80">
                            <Building2 className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[150px]">{lead.tenants.name}</span>
                        </div>
                    )}
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
                {onClaim && !lead.assigned_manager_id && lead.status === 'new' && (
                    <>
                        <Button
                            size="sm"
                            className="w-full h-7 text-xs mt-1"
                            disabled={isClaiming}
                            onClick={(e) => {
                                e.stopPropagation()
                                setClaimDialogOpen(true)
                            }}
                        >
                            {isClaiming ? (
                                <span className="animate-pulse">Берём...</span>
                            ) : (
                                <>
                                    <HandMetal className="w-3 h-3 mr-1" />
                                    Взять заявку
                                </>
                            )}
                        </Button>
                        <AlertDialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Взять заявку?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Вы берёте заявку от <span className="font-semibold text-foreground">{lead.name}</span> ({lead.phone}).
                                        После этого заявка будет закреплена за вами и исчезнет у других менеджеров.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isClaiming}>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClaimConfirm} disabled={isClaiming}>
                                        {isClaiming ? "Загрузка..." : "Да, взять!"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
                {lead.services && lead.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {lead.services.slice(0, 3).map((service: string) => (
                            <Badge key={service} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                <Tag className="w-2 h-2 mr-0.5" />
                                {service}
                            </Badge>
                        ))}
                        {lead.services.length > 3 && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                +{lead.services.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
