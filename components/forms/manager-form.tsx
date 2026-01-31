"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, Copy, Check } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
    initialData?: ManagerFormValues & {
        id: string;
        telegram_id?: number | null;
    }
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

            if (!initialData) {
                router.push("/dashboard/managers")
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
                {initialData && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Настройка Telegram уведомлений</p>
                            <div className="flex items-center gap-2 mt-1">
                                {initialData.telegram_id ? (
                                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent">
                                        <Check className="h-3 w-3 mr-1" /> Привязан
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                        Не привязан
                                    </Badge>
                                )}
                                <span className="text-xs text-orange-600 dark:text-orange-400">
                                    {initialData.telegram_id ? "Менеджер получает уведомления" : "Отправьте код боту для привязки"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white dark:bg-background border rounded-md p-1 pl-3 shadow-sm">
                                <code className="text-lg font-bold tracking-wider font-mono">
                                    {initialData.id.substring(initialData.id.length - 6).toUpperCase()}
                                </code>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => {
                                        const shortId = initialData.id.substring(initialData.id.length - 6).toUpperCase();
                                        navigator.clipboard.writeText(shortId);
                                        toast.success("Код скопирован");
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            {initialData.telegram_id && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-orange-200 text-orange-700 hover:bg-orange-100"
                                    onClick={async () => {
                                        if (confirm("Вы уверены, что хотите сбросить привязку к Telegram?")) {
                                            const supabase = createClient();
                                            const { error } = await supabase
                                                .from('users')
                                                .update({ telegram_id: null, telegram_username: null })
                                                .eq('id', initialData.id);

                                            if (!error) {
                                                toast.success("Привязка сброшена");
                                                router.refresh();
                                            }
                                        }
                                    }}
                                >
                                    Сбросить
                                </Button>
                            )}
                        </div>
                    </div>
                )}

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
                        name="tenant_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Дилер</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
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
