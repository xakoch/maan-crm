"use client"

import { useRouter } from "next/navigation"
import { updateLeadStatus } from "@/app/[crm]/dashboard/leads/actions"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    TouchSensor,
    pointerWithin,
    rectIntersection,
    CollisionDetection,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core"
import { toast } from "sonner"
import { LeadColumn } from "./leads-kanban-column"
import { LeadCard } from "./leads-kanban-card"
import { Database } from "@/types/database.types"
import { LeadEditDialog } from "./lead-edit-dialog"
import { DEFAULT_STAGES } from "@/lib/pipeline"

// Inline type to avoid import issues
type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}

export interface KanbanColumn {
    id: string
    title: string
    color: string
    is_final?: boolean
}

interface LeadsKanbanProps {
    initialLeads: Lead[]
    columns?: KanbanColumn[]
    selectionMode?: boolean
    selectedIds?: Set<string>
    onSelectLead?: (id: string) => void
    onClaimLead?: (id: string) => void
}

export function LeadsKanban({ initialLeads, columns: columnsProp, selectionMode, selectedIds, onSelectLead, onClaimLead }: LeadsKanbanProps) {
    const router = useRouter()
    const [leads, setLeads] = useState<Lead[]>(initialLeads)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [editingLead, setEditingLead] = useState<Lead | null>(null)

    const columns = columnsProp && columnsProp.length > 0 ? columnsProp : DEFAULT_STAGES
    const columnIds = useMemo(() => columns.map(c => c.id), [columns])

    useEffect(() => {
        setLeads(initialLeads)
    }, [initialLeads])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    const [originalStatus, setOriginalStatus] = useState<string | null>(null)

    // Collision detection: find the column the pointer is over
    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        // Try pointer first for precise column detection
        const pointerCollisions = pointerWithin(args)
        const columnCollision = pointerCollisions.find(c => columnIds.includes(c.id as string))
        if (columnCollision) return [columnCollision]

        // Fall back to rect intersection
        const rectCollisions = rectIntersection(args)
        const columnRect = rectCollisions.find(c => columnIds.includes(c.id as string))
        if (columnRect) return [columnRect]

        return pointerCollisions.length > 0 ? pointerCollisions : rectCollisions
    }, [columnIds])

    const onDragStart = (event: DragStartEvent) => {
        const leadId = event.active.id as string
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
            setOriginalStatus(lead.status)
        }
        setActiveId(leadId)
    }

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) {
            setOriginalStatus(null)
            return
        }

        const activeLeadId = active.id as string
        const overId = over.id as string

        // Only columns are valid drop targets
        if (!columnIds.includes(overId)) {
            setOriginalStatus(null)
            return
        }

        const newStatus = overId

        if (originalStatus && originalStatus !== newStatus) {
            // Optimistic UI update
            setLeads(prev => prev.map(l => l.id === activeLeadId ? { ...l, status: newStatus } : l))

            try {
                const result = await updateLeadStatus(activeLeadId, newStatus)

                if (!result.success) {
                    throw new Error(result.error)
                }

                toast.success(`Статус обновлен: ${columns.find(c => c.id === newStatus)?.title}`)
            } catch (error: any) {
                console.error("Failed to update status", error)
                toast.error(`Ошибка: ${error.message || "Не удалось сохранить"}`)
                // Rollback
                setLeads(prev => prev.map(l => l.id === activeLeadId ? { ...l, status: originalStatus! } : l))
            }
        }

        setOriginalStatus(null)
    }

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    }

    return (
        <DndContext
            id="leads-kanban"
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            autoScroll={{
                enabled: true,
                threshold: { x: 0.15, y: 0.15 },
                acceleration: 10,
            }}
        >
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
                {columns.map((col) => {
                    const columnLeads = leads.filter(l => l.status === col.id)
                    return (
                        <LeadColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            leads={columnLeads}
                            onLeadClick={(lead: Lead) => setEditingLead(lead)}
                            selectionMode={selectionMode}
                            selectedIds={selectedIds}
                            onSelectLead={onSelectLead}
                            onClaimLead={onClaimLead}
                        />
                    )
                })}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                    <LeadCard lead={leads.find(l => l.id === activeId)!} isOverlay />
                ) : null}
            </DragOverlay>

            <LeadEditDialog
                lead={editingLead}
                open={!!editingLead}
                onOpenChange={(open) => !open && setEditingLead(null)}
            />
        </DndContext>
    )
}
