"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, User, Phone, Mail, MapPin, Building2, MessageSquare, FileText, Banknote, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { createClient } from "@/lib/supabase/client"
import { createClientRecord, updateClientRecord, deleteClientRecord } from "@/app/dashboard/clients/actions"

const clientSchema = z.object({
    name: z.string().min(2, "Имя обязательно"),
    phone: z.string().optional(),
    email: z.string().email("Некорректный email").optional().or(z.literal("")),
    client_type: z.enum(['person', 'organization']),
    inn: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    company_id: z.string().optional(),
    tenant_id: z.string().min(1, "Выберите дилера"),
    assigned_manager_id: z.string().optional(),
    comment: z.string().optional(),
    total_deal_value: z.number().min(0).optional(),
})

type ClientValues = z.infer<typeof clientSchema>

interface ClientFormProps {
    client?: any
    dealers: { id: string; name: string }[]
    companies: { id: string; name: string; tenant_id?: string | null }[]
    onSuccess?: () => void
}

export function ClientForm({ client, dealers, companies: allCompanies, onSuccess }: ClientFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([])
    const isEditing = !!client

    const form = useForm<ClientValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: client?.name || "",
            phone: client?.phone || "",
            email: client?.email || "",
            client_type: client?.client_type || "person",
            inn: client?.inn || "",
            address: client?.address || "",
            city: client?.city || "",
            region: client?.region || "",
            company_id: client?.company_id || "none",
            tenant_id: client?.tenant_id || (dealers.length === 1 ? dealers[0].id : ""),
            assigned_manager_id: client?.assigned_manager_id || "",
            comment: client?.comment || "",
            total_deal_value: client?.total_deal_value || 0,
        },
    })

    const selectedTenantId = form.watch("tenant_id")
    const clientType = form.watch("client_type")

    // Filter companies by selected tenant
    const filteredCompanies = useMemo(() => {
        if (!selectedTenantId) return allCompanies
        return allCompanies.filter(c => c.tenant_id === selectedTenantId)
    }, [allCompanies, selectedTenantId])

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

    // Reset manager when tenant changes
    const onTenantChange = (val: string) => {
        form.setValue("tenant_id", val)
        form.setValue("assigned_manager_id", "")
        form.setValue("company_id", "")
    }

    async function onSubmit(values: ClientValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...values,
                company_id: values.company_id === "none" ? null : values.company_id,
            }
            const result = isEditing
                ? await updateClientRecord(client.id, payload)
                : await createClientRecord(payload)

            if (!result.success) throw new Error(result.error)

            toast.success(isEditing ? "Клиент обновлен" : "Клиент создан")

            if (onSuccess) {
                onSuccess()
            } else if (!isEditing) {
                router.push('/dashboard/clients')
            }
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при сохранении")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function onDelete() {
        setIsDeleting(true)
        try {
            const result = await deleteClientRecord(client.id)
            if (!result.success) throw new Error(result.error)

            toast.success("Клиент удален")
            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/dashboard/clients')
            }
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при удалении")
            setIsDeleting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                {/* Данные клиента */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Данные клиента
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Имя / Название *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="Азиз Каримов" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="client_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Тип клиента</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Выберите тип" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="person">Физическое лицо</SelectItem>
                                            <SelectItem value="organization">Юридическое лицо</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="+998 90 123 45 67" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="email@example.com" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {clientType === 'organization' && (
                            <FormField
                                control={form.control}
                                name="inn"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>ИНН</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" placeholder="1234567890" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Локация */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Локация
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Город</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ташкент" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="region"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Район / Регион</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Чиланзар" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Адрес</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ул. Примерная, д.1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Назначение */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Назначение
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="tenant_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Дилер *</FormLabel>
                                    <Select onValueChange={onTenantChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Выберите дилера" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {dealers.map((dealer) => (
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
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTenantId || managers.length === 0}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder={!selectedTenantId ? "Выберите дилера" : "Выберите менеджера"} />
                                                </div>
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
                            name="company_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Компания</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Без компании" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Без компании</SelectItem>
                                            {filteredCompanies.map(company => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
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
                            name="total_deal_value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Сумма сделки</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Banknote className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                className="pl-9"
                                                placeholder="0"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Комментарий */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            Примечание
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea className="min-h-[100px]" placeholder="Дополнительная информация..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Сохранить изменения" : "Создать клиента"}
                    </Button>

                    {isEditing && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" type="button" disabled={isDeleting}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Удалить
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие нельзя отменить. Клиент будет удален из базы данных навсегда.
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
                    )}
                </div>
            </form>
        </Form>
    )
}
