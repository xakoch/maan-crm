"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { LeadCard } from "./leads-kanban-card"
import { cn } from "@/lib/utils"
import { Database } from "@/types/database.types"

// Inline type to avoid import issues
type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}

interface LeadColumnProps {
    id: string
    title: string
    color: string
    leads: Lead[]
    onLeadClick?: (lead: Lead) => void
}

export function LeadColumn({ id, title, color, leads, onLeadClick }: LeadColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    })

    return (
        <div className="flex flex-col flex-1 min-w-[300px] h-full rounded-xl bg-muted/30 border border-border/50 backdrop-blur-sm">
            <div className={cn("p-4 border-b flex items-center justify-between rounded-t-xl sticky top-0 bg-background/80", color)}>
                <h3 className="font-semibold">{title}</h3>
                <span className="text-xs font-mono bg-background/50 px-2 py-1 rounded-md border shadow-sm">
                    {leads.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className="flex-1 p-2 overflow-y-auto space-y-2 scrollbar-hide"
            >
                <SortableContext
                    items={leads.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {leads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
                    ))}
                </SortableContext>

                {leads.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-muted-foreground/40 text-sm border-2 border-dashed border-muted-foreground/10 rounded-lg m-2">
                        Нет заявок
                    </div>
                )}
            </div>
        </div>
    )
}
