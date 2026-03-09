"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, Building2, Phone, Mail, MapPin, MessageSquare, FileText } from "lucide-react"
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

import { createCompany, updateCompany, deleteCompany } from "@/app/[crm]/dashboard/companies/actions"

const companySchema = z.object({
    name: z.string().min(2, "Название обязательно"),
    inn: z.string().optional(),
    address: z.string().optional(),
    contact_person: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email("Некорректный email").optional().or(z.literal("")),
    tenant_id: z.string().min(1, "Выберите дилера"),
    comment: z.string().optional(),
})

type CompanyValues = z.infer<typeof companySchema>

interface CompanyFormProps {
    company?: any
    dealers: { id: string; name: string }[]
    onSuccess?: () => void
}

export function CompanyForm({ company, dealers, onSuccess }: CompanyFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const isEditing = !!company

    const form = useForm<CompanyValues>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: company?.name || "",
            inn: company?.inn || "",
            address: company?.address || "",
            contact_person: company?.contact_person || "",
            contact_phone: company?.contact_phone || "",
            contact_email: company?.contact_email || "",
            tenant_id: company?.tenant_id || (dealers.length === 1 ? dealers[0].id : ""),
            comment: company?.comment || "",
        },
    })

    async function onSubmit(values: CompanyValues) {
        setIsSubmitting(true)
        try {
            const result = isEditing
                ? await updateCompany(company.id, values)
                : await createCompany(values)

            if (!result.success) throw new Error(result.error)

            toast.success(isEditing ? "Компания обновлена" : "Компания создана")

            if (onSuccess) {
                onSuccess()
            } else if (!isEditing) {
                router.push('/dashboard/companies')
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
            const result = await deleteCompany(company.id)
            if (!result.success) throw new Error(result.error)

            toast.success("Компания удалена")
            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/dashboard/companies')
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
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Основные данные
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Название компании *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ООО «Пример»" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="inn"
                            render={({ field }) => (
                                <FormItem>
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
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Адрес</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="г. Ташкент, ул. ..." {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tenant_id"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Дилер *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            Контактная информация
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="contact_person"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Контактное лицо</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Иванов Иван" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact_phone"
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
                            name="contact_email"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="info@company.com" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

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
                        {isEditing ? "Сохранить изменения" : "Создать компанию"}
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
                                        Это действие нельзя отменить. Компания будет удалена из базы данных навсегда.
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
