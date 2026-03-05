"use client"

import { useRouter } from "next/navigation"
import { updateLeadStatus } from "@/app/dashboard/leads/actions"
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
    DragOverEvent,
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
        useSensor(TouchSensor)
    )

    const [originalStatus, setOriginalStatus] = useState<string | null>(null)

    // Custom collision detection that prioritizes columns over cards
    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        const rectCollisions = rectIntersection(args)
        const columnCollision = rectCollisions.find(collision =>
            columnIds.includes(collision.id as string)
        )
        if (columnCollision) return [columnCollision]

        const pointerCollisions = pointerWithin(args)
        const columnPointerCollision = pointerCollisions.find(collision =>
            columnIds.includes(collision.id as string)
        )
        if (columnPointerCollision) return [columnPointerCollision]

        return rectCollisions.length > 0 ? rectCollisions : pointerCollisions
    }, [columnIds])

    const onDragStart = (event: DragStartEvent) => {
        const leadId = event.active.id as string
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
            setOriginalStatus(lead.status)
        }
        setActiveId(leadId)
    }

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        if (activeId === overId) return

        const activeLead = leads.find(l => l.id === activeId)
        if (!activeLead) return

        if (columnIds.includes(overId)) {
            if (activeLead.status !== overId) {
                setLeads((leads) => {
                    const activeIndex = leads.findIndex((l) => l.id === activeId)
                    const newLeads = [...leads]
                    newLeads[activeIndex] = { ...newLeads[activeIndex], status: overId }
                    return newLeads
                })
            }
        }
    }

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        if (activeId === overId) return

        const activeLead = leads.find(l => l.id === activeId)
        if (!activeLead) return

        let newStatus: string | undefined

        if (columnIds.includes(overId)) {
            newStatus = overId
        } else {
            const overLead = leads.find(l => l.id === overId)
            if (overLead) {
                newStatus = overLead.status
            }
        }

        if (newStatus && originalStatus && originalStatus !== newStatus) {
            try {
                const result = await updateLeadStatus(activeId, newStatus)

                if (!result.success) {
                    throw new Error(result.error)
                }

                toast.success(`Статус обновлен: ${columns.find(c => c.id === newStatus)?.title}`)
            } catch (error: any) {
                console.error("Failed to update status", error)
                toast.error(`Ошибка: ${error.message || "Не удалось сохранить"}`)
                setLeads(leads.map(l => l.id === activeId ? { ...l, status: originalStatus } : l))
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
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
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
