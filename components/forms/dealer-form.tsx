"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, Key, Copy, RefreshCw } from "lucide-react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const baseSchema = z.object({
    name: z.string().min(2, "Название должно быть не короче 2 символов"),
    city: z.string().min(2, "Город обязателен"),
    region: z.string().min(2, "Регион обязателен"),
    address: z.string().optional(),
    owner_name: z.string().min(2, "Имя владельца обязательно"),
    owner_phone: z.string().min(9, "Телефон обязателен"),
    status: z.enum(["active", "inactive"]),
})

const createSchema = baseSchema.extend({
    username: z.string().min(3, "Логин обязателен (мин. 3 символа)"),
    password: z.string().min(6, "Пароль обязателен (мин. 6 символов)"),
})

type DealerFormValues = z.infer<typeof createSchema>

interface DealerFormProps {
    initialData?: z.infer<typeof baseSchema> & { id: string }
}

export function DealerForm({ initialData }: DealerFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [availableRegions, setAvailableRegions] = useState<string[]>([])

    // Credentials modal state
    const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string, password: string } | null>(null)

    const form = useForm<DealerFormValues>({
        resolver: zodResolver(initialData ? baseSchema : createSchema),
        defaultValues: initialData ? {
            ...initialData,
            username: "", // Not used in edit
            password: "", // Not used in edit
        } : {
            name: "",
            city: "",
            region: "",
            address: "",
            owner_name: "",
            owner_phone: "",
            status: "active",
            username: "",
            password: "",
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

    const generateCredentials = () => {
        const name = form.getValues("name")
        if (!name) {
            toast.error("Сначала введите название филиала")
            return
        }

        // Generate username: transliterate name + random number
        const translit = (str: string) => {
            const ru: Record<string, string> = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
                'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
                'э': 'e', 'ю': 'yu', 'я': 'ya'
            }
            return str.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9]/g, '')
        }

        const usernameBase = translit(name).slice(0, 10)
        const username = `${usernameBase}_admin`

        // Generate password
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let password = ""
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        form.setValue("username", username)
        form.setValue("password", password)
        toast.info("Учетные данные сгенерированы")
    }

    async function onSubmit(values: DealerFormValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            if (initialData) {
                // Update implementation (standard)
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
                router.push("/dashboard/dealers")
                router.refresh()
            } else {
                // Create implementation (via API)
                const res = await fetch('/api/dealers/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values)
                })

                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Ошибка при создании дилера")
                }

                setCreatedCredentials({
                    username: values.username,
                    password: values.password
                })
                setCredentialsModalOpen(true)
                // Don't redirect immediately, let them see credentials
            }
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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} скопирован`)
    }

    return (
        <>
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

                        {!initialData && (
                            <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Key className="h-4 w-4" />
                                            Доступ в систему (Админ дилера)
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={generateCredentials}
                                            className="h-7 text-xs"
                                        >
                                            <RefreshCw className="mr-1 h-3 w-3" />
                                            Сгенерировать
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Логин (Username)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="company_admin" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Пароль</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input placeholder="******" {...field} />
                                                        {field.value && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute right-0 top-0 h-full"
                                                                onClick={() => copyToClipboard(field.value, "Пароль")}
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
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

            <Dialog open={credentialsModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setCredentialsModalOpen(false)
                    router.push("/dashboard/dealers")
                    router.refresh()
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Дилер успешно создан</DialogTitle>
                        <DialogDescription>
                            Сохраните данные для входа администратора дилера. <br />
                            <span className="text-red-500 font-bold">Пароль отображается только один раз!</span>
                        </DialogDescription>
                    </DialogHeader>
                    {createdCredentials && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Логин</label>
                                <div className="flex gap-2">
                                    <Input value={createdCredentials.username} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.username, "Логин")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Пароль</label>
                                <div className="flex gap-2">
                                    <Input value={createdCredentials.password} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.password, "Пароль")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => {
                            setCredentialsModalOpen(false)
                            router.push("/dashboard/dealers")
                            router.refresh()
                        }}>
                            Закрыть и перейти к списку
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
