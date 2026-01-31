"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createClient } from "../../lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const leadEditSchema = z.object({
    name: z.string().min(2, "Имя обязательно"),
    phone: z.string().min(9, "Телефон обязателен"),
    city: z.string().min(2, "Город обязателен"),
    tenant_id: z.string().min(1, "Выберите дилера"),
    assigned_manager_id: z.string().optional(),
    source: z.string().min(1, "Источник обязателен"),
    status: z.enum(['new', 'processing', 'closed', 'rejected']),
    comment: z.string().optional(),
    rejection_reason: z.string().optional(),
    conversion_value: z.number().optional()
})

type LeadEditValues = z.infer<typeof leadEditSchema>

interface LeadEditFormProps {
    lead: any // Type from DB
    history?: any[]
    onSuccess?: () => void
}

export function LeadEditForm({ lead, history = [], onSuccess }: LeadEditFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [dealers, setDealers] = useState<{ id: string, name: string }[]>([])
    const [managers, setManagers] = useState<{ id: string, full_name: string, telegram_id?: number | null }[]>([])

    // Fetch dealers for select
    useEffect(() => {
        async function fetchDealers() {
            const supabase = createClient()
            const { data } = await supabase
                .from('tenants')
                .select('id, name')
                .eq('status', 'active')

            if (data) setDealers(data)
        }
        fetchDealers()
    }, [])

    const form = useForm<LeadEditValues>({
        resolver: zodResolver(leadEditSchema),
        defaultValues: {
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
            tenant_id: lead.tenant_id || "",
            assigned_manager_id: lead.assigned_manager_id || "",
            source: lead.source || "manual",
            status: lead.status || "new",
            comment: lead.comment || "",
            rejection_reason: lead.rejection_reason || "",
            conversion_value: lead.conversion_value || 0
        },
    })

    const selectedTenantId = form.watch("tenant_id")
    const selectedStatus = form.watch("status")

    // Fetch managers when tenant changes
    useEffect(() => {
        async function fetchManagers() {
            if (!selectedTenantId) {
                setManagers([])
                return
            }

            const supabase = createClient()
            const { data } = await supabase
                .from('users')
                .select('id, full_name, telegram_id')
                .eq('tenant_id', selectedTenantId)
                .eq('role', 'manager')
                .eq('is_active', true)

            if (data) setManagers(data)
        }
        fetchManagers()
    }, [selectedTenantId])

    async function onSubmit(values: LeadEditValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            // Clean up optional fields based on status
            const updates = {
                ...values,
                assigned_manager_id: values.assigned_manager_id || null, // Ensure explicit null if empty
                rejection_reason: values.status === 'rejected' ? values.rejection_reason : null,
                conversion_value: values.status === 'closed' ? values.conversion_value : null,
                closed_at: values.status === 'closed' && lead.status !== 'closed' ? new Date().toISOString() : (values.status !== 'closed' ? null : lead.closed_at),
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from("leads")
                .update(updates)
                .eq('id', lead.id)

            if (error) throw error

            // Track changes for history
            const { data: { user } } = await supabase.auth.getUser()
            const statusChanged = values.status !== lead.status
            const managerChanged = values.assigned_manager_id !== (lead.assigned_manager_id || "") // Handle null/empty string diff

            if (statusChanged) {
                await supabase.from('lead_history').insert({
                    lead_id: lead.id,
                    changed_by: user?.id,
                    old_status: lead.status,
                    new_status: values.status,
                    comment: values.comment !== lead.comment ? 'Статус изменен + комментарий' : 'Статус изменен'
                })
            }

            if (managerChanged) {
                const oldManagerName = lead.assigned_manager?.full_name || 'Не назначен';
                const newManager = managers.find(m => m.id === values.assigned_manager_id);
                const newManagerName = newManager?.full_name || 'Не назначен';

                await supabase.from('lead_history').insert({
                    lead_id: lead.id,
                    changed_by: user?.id,
                    old_status: values.status, // Status might keep same, but we record snapshot
                    new_status: values.status,
                    comment: `Менеджер: ${oldManagerName} -> ${newManagerName}`
                })

                // Notify new manager if assigned
                if (values.assigned_manager_id) {
                    fetch('/api/leads/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId: lead.id }) // Start command will handle finding the new manager from lead
                    }).catch(e => console.error('Error notifying:', e));
                }
            }

            if (!statusChanged && !managerChanged && values.comment !== lead.comment) {
                await supabase.from('lead_history').insert({
                    lead_id: lead.id,
                    changed_by: user?.id,
                    old_status: lead.status,
                    new_status: lead.status,
                    comment: 'Комментарий обновлен'
                })
            }

            toast.success("Лид обновлен")
            router.refresh()

            if (onSuccess) {
                onSuccess()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при обновлении лида")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function onDelete() {
        setIsDeleting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', lead.id)

            if (error) throw error

            toast.success("Лид удален")

            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/dashboard/leads")
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при удалении")
            setIsDeleting(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Имя клиента</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Азиз" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Телефон</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="+998 90 123 45 67"
                                                {...field}
                                                maxLength={17}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, "");
                                                    if (!value.startsWith("998")) value = "998" + value;
                                                    if (value.length > 12) value = value.slice(0, 12);

                                                    let formatted = "+998";
                                                    if (value.length > 3) formatted += " " + value.slice(3, 5);
                                                    if (value.length > 5) formatted += " " + value.slice(5, 8);
                                                    if (value.length > 8) formatted += " " + value.slice(8, 10);
                                                    if (value.length > 10) formatted += " " + value.slice(10, 12);

                                                    field.onChange(formatted);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Город / Регион</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите регион" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Tashkent">Ташкент</SelectItem>
                                                <SelectItem value="Tashkent Region">Ташкентская область</SelectItem>
                                                <SelectItem value="Andijan">Андижанская область</SelectItem>
                                                <SelectItem value="Bukhara">Бухарская область</SelectItem>
                                                <SelectItem value="Fergana">Ферганская область</SelectItem>
                                                <SelectItem value="Jizzakh">Джизакская область</SelectItem>
                                                <SelectItem value="Namangan">Наманганская область</SelectItem>
                                                <SelectItem value="Navoi">Навоийская область</SelectItem>
                                                <SelectItem value="Qashqadaryo">Кашкадарьинская область</SelectItem>
                                                <SelectItem value="Samarkand">Самаркандская область</SelectItem>
                                                <SelectItem value="Sirdaryo">Сырдарьинская область</SelectItem>
                                                <SelectItem value="Surkhondaryo">Сурхандарьинская область</SelectItem>
                                                <SelectItem value="Xorazm">Хорезмская область</SelectItem>
                                                <SelectItem value="Karakalpakstan">Республика Каракалпакстан</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tenant_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Филиал / Дилер</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите дилера" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {dealers.map(dealer => (
                                                    <SelectItem key={dealer.id} value={dealer.id}>
                                                        {dealer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="assigned_manager_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Менеджер</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedTenantId || managers.length === 0}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите менеджера" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {managers.map(manager => (
                                                    <SelectItem key={manager.id} value={manager.id}>
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{manager.full_name}</span>
                                                            {manager.telegram_id && (
                                                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1 rounded uppercase font-bold">TG</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Источник</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите источник" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="manual">Ручной ввод</SelectItem>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="facebook">Facebook</SelectItem>
                                                <SelectItem value="website">Сайт</SelectItem>
                                                <SelectItem value="other">Другое</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Статус</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите статус" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="new">Новый</SelectItem>
                                                <SelectItem value="processing">В работе</SelectItem>
                                                <SelectItem value="closed">Закрыт</SelectItem>
                                                <SelectItem value="rejected">Отклонен</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {selectedStatus === 'closed' && (
                            <FormField
                                control={form.control}
                                name="conversion_value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Сумма сделки (сум)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedStatus === 'rejected' && (
                            <FormField
                                control={form.control}
                                name="rejection_reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Причина отказа</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Клиент передумал..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Комментарий</FormLabel>
                                    <FormControl>
                                        <Textarea className="min-h-[100px]" placeholder="Дополнительная информация..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-between items-center">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить изменения
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" type="button" disabled={isDeleting}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Удалить лид
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Это действие нельзя отменить. Лид будет удален из базы данных навсегда.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Удалить
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </form>
                </Form>
            </div>

            <div className="space-y-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4">История изменений</h3>
                    <div className="space-y-4">
                        {history.length === 0 && <p className="text-sm text-muted-foreground">История пуста</p>}
                        {history.map((record: any) => (
                            <div key={record.id} className="relative pb-4 pl-4 border-l last:border-0 border-gray-200 dark:border-gray-800">
                                <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                                <div className="text-sm font-medium">
                                    {record.new_status ? `Статус: ${record.new_status}` : 'Изменение'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(record.created_at), "d MMM yyyy HH:mm", { locale: ru })}
                                </div>
                                {record.users && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Автор: {record.users.full_name}
                                    </div>
                                )}
                                {record.comment && (
                                    <div className="text-sm mt-1 bg-muted p-2 rounded-md">
                                        {record.comment}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
