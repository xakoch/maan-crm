"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, Copy, ExternalLink, CopyPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { FormConfig } from "@/types/app"
import { createFormConfig, updateFormConfig, deleteFormConfig } from "@/app/actions/settings"

const AVAILABLE_FIELDS = [
    { id: "name", label: "Имя" },
    { id: "phone", label: "Телефон" },
    { id: "city", label: "Город/Регион" },
    { id: "services", label: "Услуги" },
]

interface FormManagementProps {
    initialForms: FormConfig[]
}

export function FormManagement({ initialForms }: FormManagementProps) {
    const [forms, setForms] = useState<FormConfig[]>(initialForms)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingForm, setEditingForm] = useState<FormConfig | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formState, setFormState] = useState({
        slug: "",
        title_ru: "",
        title_uz: "",
        subtitle_ru: "",
        subtitle_uz: "",
        crm_type: "lumara" as "lumara" | "maan",
        enabled_fields: ["name", "phone"] as string[],
        is_active: true,
    })

    function openCreate() {
        setEditingForm(null)
        setFormState({
            slug: "",
            title_ru: "",
            title_uz: "",
            subtitle_ru: "",
            subtitle_uz: "",
            crm_type: "lumara",
            enabled_fields: ["name", "phone"],
            is_active: true,
        })
        setDialogOpen(true)
    }

    function openEdit(form: FormConfig) {
        setEditingForm(form)
        setFormState({
            slug: form.slug,
            title_ru: form.title_ru,
            title_uz: form.title_uz,
            subtitle_ru: form.subtitle_ru || "",
            subtitle_uz: form.subtitle_uz || "",
            crm_type: form.crm_type,
            enabled_fields: [...form.enabled_fields],
            is_active: form.is_active,
        })
        setDialogOpen(true)
    }

    function toggleField(fieldId: string) {
        setFormState(prev => {
            const fields = prev.enabled_fields.includes(fieldId)
                ? prev.enabled_fields.filter(f => f !== fieldId)
                : [...prev.enabled_fields, fieldId]
            return { ...prev, enabled_fields: fields }
        })
    }

    async function handleSubmit() {
        if (!formState.slug || !formState.title_ru || !formState.title_uz) {
            toast.error("Заполните обязательные поля")
            return
        }

        setIsSubmitting(true)
        try {
            const data = {
                ...formState,
                subtitle_ru: formState.subtitle_ru || null,
                subtitle_uz: formState.subtitle_uz || null,
            }

            let result
            if (editingForm) {
                result = await updateFormConfig(editingForm.id, data)
            } else {
                result = await createFormConfig(data as any)
            }

            if (!result.success) throw new Error(result.error)

            toast.success(editingForm ? "Форма обновлена" : "Форма создана")
            setDialogOpen(false)
            // Refresh data
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка при сохранении")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete() {
        if (!deletingId) return
        setIsSubmitting(true)
        try {
            const result = await deleteFormConfig(deletingId)
            if (!result.success) throw new Error(result.error)
            toast.success("Форма удалена")
            setDeleteDialogOpen(false)
            setDeletingId(null)
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка при удалении")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleToggleActive(form: FormConfig) {
        const result = await updateFormConfig(form.id, { is_active: !form.is_active })
        if (!result.success) {
            toast.error("Ошибка при обновлении")
            return
        }
        setForms(prev => prev.map(f => f.id === form.id ? { ...f, is_active: !f.is_active } : f))
        toast.success(form.is_active ? "Форма отключена" : "Форма включена")
    }

    function copyUrl(slug: string) {
        const url = `${window.location.origin}/form/${slug}`
        navigator.clipboard.writeText(url)
        toast.success("Ссылка скопирована")
    }

    async function cloneForm(form: FormConfig) {
        setIsSubmitting(true)
        try {
            const result = await createFormConfig({
                slug: `${form.slug}-copy`,
                title_ru: `${form.title_ru} (копия)`,
                title_uz: `${form.title_uz} (nusxa)`,
                subtitle_ru: form.subtitle_ru || undefined,
                subtitle_uz: form.subtitle_uz || undefined,
                crm_type: form.crm_type,
                enabled_fields: [...form.enabled_fields],
                is_active: false,
            } as any)
            if (!result.success) throw new Error(result.error)
            toast.success("Форма клонирована")
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка клонирования")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Формы заявок</h3>
                <Button onClick={openCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Создать форму
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>CRM</TableHead>
                        <TableHead>Поля</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map((form) => (
                        <TableRow key={form.id}>
                            <TableCell className="font-medium">{form.title_ru}</TableCell>
                            <TableCell>
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/form/{form.slug}</code>
                            </TableCell>
                            <TableCell>
                                <Badge variant={form.crm_type === 'maan' ? 'default' : 'secondary'}>
                                    {form.crm_type === 'maan' ? 'MAAN' : 'Lumara'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                    {form.enabled_fields.map(f => (
                                        <Badge key={f} variant="outline" className="text-xs">
                                            {AVAILABLE_FIELDS.find(af => af.id === f)?.label || f}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={() => handleToggleActive(form)}
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyUrl(form.slug)}
                                        title="Копировать ссылку"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(`/form/${form.slug}`, '_blank')}
                                        title="Открыть форму"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => cloneForm(form)}
                                        title="Клонировать форму"
                                    >
                                        <CopyPlus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(form)}
                                        title="Редактировать"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setDeletingId(form.id)
                                            setDeleteDialogOpen(true)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {forms.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Нет созданных форм
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingForm ? "Редактировать форму" : "Создать форму"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Slug (URL)</Label>
                            <Input
                                value={formState.slug}
                                onChange={e => setFormState(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                                placeholder="my-form"
                            />
                            <p className="text-xs text-muted-foreground mt-1">URL формы: /form/{formState.slug || '...'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Заголовок (RU)</Label>
                                <Input
                                    value={formState.title_ru}
                                    onChange={e => setFormState(prev => ({ ...prev, title_ru: e.target.value }))}
                                    placeholder="Узнать стоимость"
                                />
                            </div>
                            <div>
                                <Label>Заголовок (UZ)</Label>
                                <Input
                                    value={formState.title_uz}
                                    onChange={e => setFormState(prev => ({ ...prev, title_uz: e.target.value }))}
                                    placeholder="Narxini bilish"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Подзаголовок (RU)</Label>
                                <Input
                                    value={formState.subtitle_ru}
                                    onChange={e => setFormState(prev => ({ ...prev, subtitle_ru: e.target.value }))}
                                    placeholder="Заполните форму..."
                                />
                            </div>
                            <div>
                                <Label>Подзаголовок (UZ)</Label>
                                <Input
                                    value={formState.subtitle_uz}
                                    onChange={e => setFormState(prev => ({ ...prev, subtitle_uz: e.target.value }))}
                                    placeholder="Formani to'ldiring..."
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Привязка к CRM</Label>
                            <Select
                                value={formState.crm_type}
                                onValueChange={(v: 'lumara' | 'maan') => setFormState(prev => ({ ...prev, crm_type: v }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lumara">Lumara (Дилерская CRM)</SelectItem>
                                    <SelectItem value="maan">MAAN</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-2 block">Поля формы</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {AVAILABLE_FIELDS.map(field => (
                                    <div key={field.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`field-${field.id}`}
                                            checked={formState.enabled_fields.includes(field.id)}
                                            onCheckedChange={() => toggleField(field.id)}
                                        />
                                        <label htmlFor={`field-${field.id}`} className="text-sm">
                                            {field.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formState.is_active}
                                onCheckedChange={v => setFormState(prev => ({ ...prev, is_active: v }))}
                            />
                            <Label>Активна</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingForm ? "Сохранить" : "Создать"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить форму?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Форма будет удалена, но существующие лиды сохранятся.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
