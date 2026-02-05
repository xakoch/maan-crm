"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User, Phone, MapPin, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { createLead } from "@/app/dashboard/leads/actions"

const MAIN_REGIONS = [
    "Toshkent shahar",
    "Toshkent viloyat",
    "Samarqand",
    "Buxoro",
    "Farg'ona",
    "Namangan",
    "Andijon",
    "Qashqadaryo",
    "Surxandaryo",
    "Xorazm",
    "Navoiy",
    "Jizzax",
    "Sirdaryo",
    "Qoraqalpog'iston Respublikasi"
] as const;

// Districts for Toshkent shahar
const TASHKENT_DISTRICTS = [
    "Bektemir",
    "Chilonzor",
    "Mirobod",
    "Mirzo Ulug'bek",
    "Olmazor",
    "Sergeli",
    "Shayxontohur",
    "Uchtepa",
    "Yakkasaroy",
    "Yashnobod",
    "Yunusobod",
    "Yangihayot"
] as const;

// Temporary simplified list for user request (specific regions mentioned)
const ACTIVE_REGIONS = [
    "Toshkent shahar",
    "Toshkent viloyat",
    "Qashqadaryo",
    "Namangan",
    "Samarqand",
    "Jizzax",
    "Surxandaryo"
] as const;

const leadCreateSchema = z.object({
    name: z.string().min(2, "Имя обязательно"),
    phone: z.string().min(9, "Телефон обязателен"),
    city: z.string().min(1, "Выберите город/область"),
    region: z.string().optional(), // District, optional
    comment: z.string().optional(),
    status: z.string(),
    source: z.string(),
    tenant_id: z.string().nullable().optional(),
    assigned_manager_id: z.string().nullable().optional(),
})

type LeadCreateValues = z.infer<typeof leadCreateSchema>

interface LeadCreateFormProps {
    onSuccess?: () => void
}

export function LeadCreateForm({ onSuccess }: LeadCreateFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<LeadCreateValues>({
        resolver: zodResolver(leadCreateSchema),
        defaultValues: {
            name: "",
            phone: "+998",
            city: "",
            region: "",
            comment: "",
            status: "new",
            source: "manual",
            tenant_id: null,
            assigned_manager_id: null,
        },
    })

    const selectedCity = form.watch("city");

    async function onSubmit(values: LeadCreateValues) {
        setIsSubmitting(true)
        try {
            // Clean up region if not Toshkent shahar
            const submissionData = {
                ...values,
                region: values.city === "Toshkent shahar" ? values.region : null,
            }

            const res = await createLead(submissionData)

            if (!res.success) {
                throw new Error(res.error)
            }

            toast.success("Лид успешно создан и отправлен в группу")

            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/dashboard/leads")
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при создании лида")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Группа: Данные клиента */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Новая заявка
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Имя клиента</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input className="pl-9" placeholder="Имя" {...field} />
                                                </div>
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
                                                <div className="relative">
                                                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        className="pl-9"
                                                        placeholder="+998 90 123 45 67"
                                                        {...field}
                                                        maxLength={19}
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
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Город / Область</FormLabel>
                                            <Select
                                                onValueChange={(val) => {
                                                    field.onChange(val);
                                                    // Reset region/district when city changes
                                                    form.setValue("region", "");
                                                }}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Выберите область" />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ACTIVE_REGIONS.map(region => (
                                                        <SelectItem key={region} value={region}>{region}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {selectedCity === "Toshkent shahar" && (
                                    <FormField
                                        control={form.control}
                                        name="region"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 md:col-span-1">
                                                <FormLabel>Район (Ташкент)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                <SelectValue placeholder="Выберите район" />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {TASHKENT_DISTRICTS.map(district => (
                                                            <SelectItem key={district} value={district}>{district}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
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

                        <div className="flex justify-start pt-4 border-t mt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Создать заявку
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
