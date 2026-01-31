"use client"

import { useRouter } from "next/navigation"
import { updateLeadStatus } from "@/app/dashboard/leads/actions"
import { useState, useEffect, useCallback } from "react"
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
    UniqueIdentifier,
} from "@dnd-kit/core"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { LeadColumn } from "./leads-kanban-column"
import { LeadCard } from "./leads-kanban-card"
import { Database } from "@/types/database.types"
import { LeadEditDialog } from "./lead-edit-dialog"

// Inline type to avoid import issues
type Lead = Database['public']['Tables']['leads']['Row'] & {
    tenants: { name: string } | null
    managers: { full_name: string } | null
}

type LeadStatus = 'new' | 'processing' | 'closed' | 'rejected'

interface LeadsKanbanProps {
    initialLeads: Lead[]
}

const columnIds: LeadStatus[] = ['new', 'processing', 'closed', 'rejected']

const columns: { id: LeadStatus; title: string, color: string }[] = [
    { id: 'new', title: 'Новые', color: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400' },
    { id: 'processing', title: 'В работе', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400' },
    { id: 'closed', title: 'Закрыто', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    { id: 'rejected', title: 'Отказано', color: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400' },
]

// Custom collision detection that prioritizes columns over cards
const customCollisionDetection: CollisionDetection = (args) => {
    // First, use rectIntersection to get all intersecting droppables
    const rectCollisions = rectIntersection(args)

    // If there's a column in the collisions, prioritize it
    const columnCollision = rectCollisions.find(collision =>
        columnIds.includes(collision.id as LeadStatus)
    )

    if (columnCollision) {
        return [columnCollision]
    }

    // If no column found via rectIntersection, try pointerWithin
    const pointerCollisions = pointerWithin(args)
    const columnPointerCollision = pointerCollisions.find(collision =>
        columnIds.includes(collision.id as LeadStatus)
    )

    if (columnPointerCollision) {
        return [columnPointerCollision]
    }

    // Fallback: return all collisions (might include cards)
    return rectCollisions.length > 0 ? rectCollisions : pointerCollisions
}

export function LeadsKanban({ initialLeads }: LeadsKanbanProps) {
    const router = useRouter()
    const [leads, setLeads] = useState<Lead[]>(initialLeads)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [editingLead, setEditingLead] = useState<Lead | null>(null)

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

    const [originalStatus, setOriginalStatus] = useState<LeadStatus | null>(null)

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
        const overLead = leads.find(l => l.id === overId)

        if (!activeLead) return

        // Dropping over a column (empty or not)
        if (columns.some(col => col.id === overId)) {
            const overColumnId = overId as LeadStatus
            if (activeLead.status !== overColumnId) {
                setLeads((leads) => {
                    const activeIndex = leads.findIndex((l) => l.id === activeId)
                    const newLeads = [...leads]
                    newLeads[activeIndex] = { ...newLeads[activeIndex], status: overColumnId }
                    return newLeads
                })
            }
        }
    }

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) {
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        // Skip if dropped on itself
        if (activeId === overId) {
            return
        }

        const activeLead = leads.find(l => l.id === activeId)
        if (!activeLead) {
            return
        }

        let newStatus: LeadStatus | undefined

        // Check if dropped over a column container (column IDs are 'new', 'processing', 'closed', 'rejected')
        if (columns.some(col => col.id === overId)) {
            newStatus = overId as LeadStatus
        }
        // If dropped over another card, inherit its status
        else {
            const overLead = leads.find(l => l.id === overId)
            if (overLead) {
                newStatus = overLead.status
            }
        }

        if (newStatus && originalStatus && originalStatus !== newStatus) {
            // State already updated by onDragOver, no need for optimistic update here

            // Server update (via Server Action)
            try {
                const result = await updateLeadStatus(activeId, newStatus)

                if (!result.success) {
                    throw new Error(result.error)
                }

                toast.success(`Статус обновлен: ${columns.find(c => c.id === newStatus)?.title}`)
            } catch (error: any) {
                console.error("Failed to update status", error)
                toast.error(`Ошибка: ${error.message || "Не удалось сохранить"}`)
                // Revert to original status
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
