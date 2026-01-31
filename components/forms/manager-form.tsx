"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { createClient } from "../../lib/supabase/client"

const managerFormSchema = z.object({
    full_name: z.string().min(2, "Имя должно быть не короче 2 символов"),
    email: z.string().email("Введите корректный email"),
    phone: z.string().min(9, "Телефон обязателен"),
    tenant_id: z.string().min(1, "Выберите дилера"),
    telegram_username: z.string().optional(),
    is_active: z.boolean(),
    password: z.string().optional(), // For creation only
})

type ManagerFormValues = z.infer<typeof managerFormSchema>

interface ManagerFormProps {
    initialData?: ManagerFormValues & { id: string }
}

export function ManagerForm({ initialData }: ManagerFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [dealers, setDealers] = useState<{ id: string, name: string }[]>([])

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

    const form = useForm<ManagerFormValues>({
        resolver: zodResolver(managerFormSchema),
        defaultValues: initialData || {
            full_name: "",
            email: "",
            phone: "",
            tenant_id: "",
            telegram_username: "",
            is_active: true,
            password: "",
        },
    })

    async function onSubmit(values: ManagerFormValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            const dataToSave = {
                full_name: values.full_name,
                email: values.email,
                phone: values.phone,
                tenant_id: values.tenant_id,
                telegram_username: values.telegram_username || null,
                is_active: values.is_active,
                role: 'manager' as 'manager'
            }

            let error;

            if (initialData) {
                // Update
                const { error: updateError } = await supabase
                    .from("users")
                    .update(dataToSave)
                    .eq('id', initialData.id)
                error = updateError
            } else {
                // Create
                const { error: createError } = await supabase
                    .from("users")
                    .insert([dataToSave])
                error = createError
            }

            if (error) throw error

            toast.success(initialData ? "Менеджер обновлен" : "Менеджер создан")
            router.push("/dashboard/managers")
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
            const supabase = createClient()
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', initialData?.id!)

            if (error) throw error

            toast.success("Менеджер удален")
            router.push("/dashboard/managers")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при удалении")
            setIsDeleting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ФИО</FormLabel>
                                <FormControl>
                                    <Input placeholder="Aziz Azizov" {...field} />
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
                                    <Input placeholder="ivan@example.com" {...field} />
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
                        name="tenant_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Дилер</FormLabel>
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
                        name="telegram_username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telegram Username (без @)</FormLabel>
                                <FormControl>
                                    <Input placeholder="ivan_manager" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Активен
                                    </FormLabel>
                                    <FormDescription>
                                        Доступ менеджера к системе
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Сохранить изменения" : "Создать менеджера"}
                    </Button>

                    {initialData && (
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
                                        Это действие нельзя отменить. Пользователь будет удален из системы.
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
