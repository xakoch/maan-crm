"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { createClient } from "../../lib/supabase/client"

const dealerFormSchema = z.object({
    name: z.string().min(2, "Название должно быть не короче 2 символов"),
    city: z.string().min(2, "Город обязателен"),
    address: z.string().optional(),
    owner_name: z.string().min(2, "Имя владельца обязательно"),
    owner_phone: z.string().min(9, "Телефон обязателен"),
    status: z.enum(["active", "inactive"]),
})

type DealerFormValues = z.infer<typeof dealerFormSchema>

interface DealerFormProps {
    initialData?: DealerFormValues & { id: string }
}

export function DealerForm({ initialData }: DealerFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const form = useForm<DealerFormValues>({
        resolver: zodResolver(dealerFormSchema),
        defaultValues: initialData || {
            name: "",
            city: "",
            address: "",
            owner_name: "",
            owner_phone: "",
            status: "active",
        },
    })

    async function onSubmit(values: DealerFormValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            if (initialData) {
                const { error } = await supabase
                    .from("tenants")
                    .update({
                        name: values.name,
                        city: values.city,
                        address: values.address || null,
                        owner_name: values.owner_name,
                        owner_phone: values.owner_phone,
                        status: values.status,
                    })
                    .eq('id', initialData.id)

                if (error) throw error
                toast.success("Дилер обновлен")
            } else {
                const { error } = await supabase
                    .from("tenants")
                    .insert([{
                        name: values.name,
                        city: values.city,
                        address: values.address || null,
                        owner_name: values.owner_name,
                        owner_phone: values.owner_phone,
                        status: values.status,
                    }])

                if (error) throw error
                toast.success("Дилер создан")
            }

            router.push("/dashboard/dealers")
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
                .from('tenants')
                .delete()
                .eq('id', initialData?.id!)

            if (error) throw error

            toast.success("Дилер удален")
            router.push("/dashboard/dealers")
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
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Название дилера</FormLabel>
                                <FormControl>
                                    <Input placeholder="ООО Автомир" {...field} />
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
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Адрес</FormLabel>
                                <FormControl>
                                    <Input placeholder="ул. Амира Темура, 1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="owner_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Имя владельца/директора</FormLabel>
                                <FormControl>
                                    <Input placeholder="Aziz Azizov" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="owner_phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Телефон владельца</FormLabel>
                                <FormControl>
                                    <Input placeholder="+998 90 123 45 67" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Активен
                                    </FormLabel>
                                    <FormDescription>
                                        Дилер будет доступен для выбора и работы
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value === 'active'}
                                        onCheckedChange={(checked) =>
                                            field.onChange(checked ? 'active' : 'inactive')
                                        }
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Сохранить изменения" : "Создать дилера"}
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
                                        Это действие нельзя отменить. Дилер и все связанные данные будут удалены.
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
