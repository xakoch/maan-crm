"use client"

import { useDraggable } from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Phone, Building2, HandMetal } from "lucide-react"
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
        isDragging,
    } = useDraggable({
        id: lead.id,
        data: {
            type: "Lead",
            lead,
        },
    })

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        touchAction: 'none' as const,
    }

    const shortId = lead.id.slice(0, 8).toUpperCase()

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 p-3 border-2 border-dashed border-primary/50 rounded-lg h-[80px] bg-muted/50"
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
                "group relative hover:shadow-md transition-all border-l-4 !py-0 !gap-0",
                selectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
                isOverlay ? "rotate-2 scale-105 shadow-xl cursor-grabbing z-50 border-primary" : "border-l-transparent hover:border-l-primary/50",
                selected && "ring-2 ring-primary bg-primary/5",
                "bg-card text-card-foreground"
            )}
        >
            <CardContent className="p-3 space-y-3">
                {/* Row 1: ID + selection checkbox */}
                <div className="flex items-center gap-2">
                    {selectionMode && (
                        <div className={cn(
                            "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                            selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                        )}>
                            {selected && (
                                <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                    <span className="text-[11px] font-mono text-muted-foreground/70">#{shortId}</span>
                </div>

                {/* Row 2: Client name */}
                <div className="text-sm font-semibold truncate leading-tight">
                    {lead.name}
                </div>

                {/* Row 3: Phone */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{lead.phone}</span>
                </div>

                {/* Row 4: Manager */}
                {lead.managers?.full_name && (
                    <div className="text-xs text-primary/80 flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{lead.managers.full_name}</span>
                    </div>
                )}

                {/* Row 5: Dealer */}
                {lead.tenants?.name && (
                    <div className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{lead.tenants.name}</span>
                    </div>
                )}

                {/* Claim button */}
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
                        <AlertDialog open={claimDialogOpen} onOpenChange={(open) => {
                            if (!open) setClaimDialogOpen(false)
                        }}>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Взять заявку?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Вы берёте заявку от <span className="font-semibold text-foreground">{lead.name}</span> ({lead.phone}).
                                        После этого заявка будет закреплена за вами и исчезнет у других менеджеров.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isClaiming} onClick={(e) => e.stopPropagation()}>
                                        Отмена
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClaimConfirm()
                                        }}
                                        disabled={isClaiming}
                                    >
                                        {isClaiming ? "Загрузка..." : "Да, взять!"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
