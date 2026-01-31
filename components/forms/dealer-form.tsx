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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "../../lib/supabase/client"
import { cities, getRegions } from "@/lib/uzbekistan-regions"

const dealerFormSchema = z.object({
    name: z.string().min(2, "Название должно быть не короче 2 символов"),
    city: z.string().min(2, "Город обязателен"),
    region: z.string().min(2, "Регион обязателен"),
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
    const [availableRegions, setAvailableRegions] = useState<string[]>([])

    const form = useForm<DealerFormValues>({
        resolver: zodResolver(dealerFormSchema),
        defaultValues: initialData || {
            name: "",
            city: "",
            region: "",
            address: "",
            owner_name: "",
            owner_phone: "",
            status: "active",
        },
    })

    // Watch city field and update available regions
    const selectedCity = form.watch("city")

    useEffect(() => {
        if (selectedCity) {
            const regions = getRegions(selectedCity)
            setAvailableRegions(regions)
            // Reset region if city changed and current region is not in new city's regions
            const currentRegion = form.getValues("region")
            if (currentRegion && !regions.includes(currentRegion)) {
                form.setValue("region", "")
            }
        } else {
            setAvailableRegions([])
        }
    }, [selectedCity, form])

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
                        region: values.region,
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
                        region: values.region,
                        address: values.address || null,
                        owner_name: values.owner_name,
                        owner_phone: values.owner_phone,
                        status: values.status,
                    }])

                if (error) throw error
                toast.success("Дилер создан")
                router.push("/dashboard/dealers")
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
                                <FormLabel>Город / Область</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Выберите город" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
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
                        name="region"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Район</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!selectedCity || availableRegions.length === 0}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={selectedCity ? "Выберите район" : "Сначала выберите город"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableRegions.map((region) => (
                                            <SelectItem key={region} value={region}>
                                                {region}
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
