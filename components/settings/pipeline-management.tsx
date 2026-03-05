"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GripVertical, Plus, Pencil, Trash2, Lock, Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    createPipelineStage,
    updatePipelineStage,
    deletePipelineStage,
    reorderPipelineStages,
} from "@/app/actions/settings"
import { STAGE_COLOR_OPTIONS, STAGE_COLOR_MAP } from "@/lib/pipeline"
import type { PipelineStage } from "@/lib/pipeline"

interface PipelineManagementProps {
    initialStages: PipelineStage[]
}

function SortableStageItem({
    stage,
    onEdit,
    onDelete,
}: {
    stage: PipelineStage
    onEdit: (stage: PipelineStage) => void
    onDelete: (stage: PipelineStage) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stage.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const colorClasses = STAGE_COLOR_MAP[stage.color] || STAGE_COLOR_MAP.gray

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 bg-background border rounded-lg",
                isDragging && "opacity-50 shadow-lg z-50"
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className={cn("w-3 h-3 rounded-full shrink-0", colorClasses.split(' ')[0]?.replace('/10', ''))} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{stage.title}</span>
                    <span className="text-xs text-muted-foreground font-mono">{stage.slug}</span>
                    {stage.is_system && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            <Lock className="w-2.5 h-2.5 mr-0.5" />
                            Системный
                        </Badge>
                    )}
                    {stage.is_final && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            <Flag className="w-2.5 h-2.5 mr-0.5" />
                            Финальный
                        </Badge>
                    )}
                </div>
            </div>

            <div className={cn("px-2 py-0.5 rounded text-xs font-medium border", colorClasses)}>
                {stage.title}
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(stage)}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                {!stage.is_system && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(stage)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    )
}

function StageList({
    stages,
    crmType,
    onStagesChange,
}: {
    stages: PipelineStage[]
    crmType: 'lumara' | 'maan'
    onStagesChange: (stages: PipelineStage[]) => void
}) {
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [formTitle, setFormTitle] = useState("")
    const [formSlug, setFormSlug] = useState("")
    const [formColor, setFormColor] = useState("gray")
    const [formIsFinal, setFormIsFinal] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const crmStages = stages
        .filter(s => s.crm_type === crmType)
        .sort((a, b) => a.sort_order - b.sort_order)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = crmStages.findIndex(s => s.id === active.id)
        const newIndex = crmStages.findIndex(s => s.id === over.id)
        const reordered = arrayMove(crmStages, oldIndex, newIndex)

        // Update local state
        const updatedAll = stages.map(s => {
            const idx = reordered.findIndex(r => r.id === s.id)
            if (idx !== -1) return { ...s, sort_order: idx }
            return s
        })
        onStagesChange(updatedAll)

        // Save to server
        const result = await reorderPipelineStages(reordered.map(s => s.id))
        if (!result.success) {
            toast.error(result.error || "Ошибка сортировки")
        }
    }

    const openCreateDialog = () => {
        setEditingStage(null)
        setIsCreating(true)
        setFormTitle("")
        setFormSlug("")
        setFormColor("gray")
        setFormIsFinal(false)
        setIsDialogOpen(true)
    }

    const openEditDialog = (stage: PipelineStage) => {
        setEditingStage(stage)
        setIsCreating(false)
        setFormTitle(stage.title)
        setFormSlug(stage.slug)
        setFormColor(stage.color)
        setFormIsFinal(stage.is_final)
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formTitle.trim() || !formSlug.trim()) {
            toast.error("Заполните название и slug")
            return
        }

        setIsSaving(true)
        try {
            if (isCreating) {
                const result = await createPipelineStage({
                    slug: formSlug.trim().toLowerCase().replace(/\s+/g, '_'),
                    title: formTitle.trim(),
                    color: formColor,
                    sort_order: crmStages.length,
                    crm_type: crmType,
                    is_final: formIsFinal,
                })
                if (!result.success) throw new Error(result.error)
                toast.success("Этап создан")
            } else if (editingStage) {
                const result = await updatePipelineStage(editingStage.id, {
                    slug: editingStage.is_system ? undefined : formSlug.trim().toLowerCase().replace(/\s+/g, '_'),
                    title: formTitle.trim(),
                    color: formColor,
                    is_final: formIsFinal,
                })
                if (!result.success) throw new Error(result.error)
                toast.success("Этап обновлен")
            }
            setIsDialogOpen(false)
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка сохранения")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (stage: PipelineStage) => {
        if (!confirm(`Удалить этап "${stage.title}"?`)) return
        const result = await deletePipelineStage(stage.id)
        if (!result.success) {
            toast.error(result.error || "Ошибка удаления")
            return
        }
        toast.success("Этап удален")
        onStagesChange(stages.filter(s => s.id !== stage.id))
    }

    const handleTitleChange = (value: string) => {
        setFormTitle(value)
        if (isCreating) {
            setFormSlug(value.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '_').replace(/^_|_$/g, ''))
        }
    }

    return (
        <div className="space-y-3">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={crmStages.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {crmStages.map(stage => (
                            <SortableStageItem
                                key={stage.id}
                                stage={stage}
                                onEdit={openEditDialog}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {crmStages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Нет этапов. Добавьте первый этап воронки.
                </div>
            )}

            <Button onClick={openCreateDialog} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Добавить этап
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isCreating ? "Новый этап" : "Редактировать этап"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                                value={formTitle}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Например: Переговоры"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug (идентификатор)</Label>
                            <Input
                                value={formSlug}
                                onChange={(e) => setFormSlug(e.target.value)}
                                placeholder="negotiations"
                                disabled={editingStage?.is_system}
                            />
                            {editingStage?.is_system && (
                                <p className="text-xs text-muted-foreground">
                                    Slug системного этапа нельзя изменить
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Цвет</Label>
                            <div className="flex flex-wrap gap-2">
                                {STAGE_COLOR_OPTIONS.map(color => {
                                    const classes = STAGE_COLOR_MAP[color]
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => setFormColor(color)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all",
                                                classes,
                                                formColor === color
                                                    ? "ring-2 ring-primary ring-offset-2 scale-105"
                                                    : "opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            {color}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Финальный этап</Label>
                                <p className="text-xs text-muted-foreground">
                                    При переходе на этот этап автоматически создается клиент
                                </p>
                            </div>
                            <Switch
                                checked={formIsFinal}
                                onCheckedChange={setFormIsFinal}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export function PipelineManagement({ initialStages }: PipelineManagementProps) {
    const [stages, setStages] = useState<PipelineStage[]>(initialStages)

    return (
        <Tabs defaultValue="lumara">
            <TabsList>
                <TabsTrigger value="lumara">Lumara</TabsTrigger>
                <TabsTrigger value="maan">MAAN</TabsTrigger>
            </TabsList>
            <TabsContent value="lumara" className="mt-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Настройте этапы воронки для CRM Lumara. Перетаскивайте для изменения порядка.
                    </p>
                    <StageList stages={stages} crmType="lumara" onStagesChange={setStages} />
                </div>
            </TabsContent>
            <TabsContent value="maan" className="mt-4">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Настройте этапы воронки для CRM MAAN. Перетаскивайте для изменения порядка.
                    </p>
                    <StageList stages={stages} crmType="maan" onStagesChange={setStages} />
                </div>
            </TabsContent>
        </Tabs>
    )
}
