"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

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

const leadCreateSchema = z.object({
    name: z.string().min(2, "Имя обязательно"),
    phone: z.string().min(9, "Телефон обязателен"),
    city: z.string().min(2, "Город обязателен"),
    tenant_id: z.string().min(1, "Выберите дилера"),
    assigned_manager_id: z.string().optional(),
    source: z.string().min(1, "Источник обязателен"),
    status: z.enum(['new', 'processing', 'closed', 'rejected']).default('new'),
    comment: z.string().optional(),
})

type LeadCreateValues = z.infer<typeof leadCreateSchema>

export function LeadCreateForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dealers, setDealers] = useState<{ id: string, name: string }[]>([])
    const [managers, setManagers] = useState<{ id: string, full_name: string }[]>([])

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

    const form = useForm({
        resolver: zodResolver(leadCreateSchema),
        defaultValues: {
            name: "",
            phone: "",
            city: "",
            tenant_id: "", // Initialize to empty string
            assigned_manager_id: "", // Initialize to empty string
            status: 'new',
            source: 'manual',
            comment: ""
        },
    })

    const selectedTenantId = form.watch("tenant_id")

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
                .select('id, full_name')
                .eq('tenant_id', selectedTenantId)
                .eq('role', 'manager')
                .eq('is_active', true)

            if (data) setManagers(data)
        }
        fetchManagers()
    }, [selectedTenantId])

    async function onSubmit(values: LeadCreateValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            const { error } = await supabase
                .from("leads")
                .insert([{
                    name: values.name,
                    phone: values.phone,
                    city: values.city,
                    tenant_id: values.tenant_id,
                    assigned_manager_id: values.assigned_manager_id || null,
                    source: values.source,
                    status: values.status,
                    comment: values.comment || null
                }])

            if (error) throw error

            toast.success("Лид успешно создан")
            router.push("/dashboard/leads")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при создании лида")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
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
                                    <Input placeholder="+998 90 123 45 67" {...field} />
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

                    {/* Manager Selection - only shows if managers exist for tenant */}
                    <FormField
                        control={form.control}
                        name="assigned_manager_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Менеджер (опционально)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedTenantId || managers.length === 0}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите менеджера" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {managers.map(manager => (
                                            <SelectItem key={manager.id} value={manager.id}>
                                                {manager.full_name}
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

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать лид
                </Button>
            </form>
        </Form>
    )
}
