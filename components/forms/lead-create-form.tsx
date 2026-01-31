"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User, Phone, MapPin, Building2, Globe, Activity, MessageSquare, UserCheck } from "lucide-react"
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
import { createClient } from "../../lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"

const leadCreateSchema = z.object({
    name: z.string().min(2, "Имя обязательно"),
    phone: z.string().min(9, "Телефон обязателен"),
    city: z.string().min(1, "Город обязателен"),
    region: z.string().optional(),
    tenant_id: z.string().min(1, "Выберите дилера"),
    assigned_manager_id: z.string().optional(),
    source: z.string().min(1, "Источник обязателен"),
    status: z.enum(['new', 'processing', 'closed', 'rejected']),
    comment: z.string().optional(),
})

type LeadCreateValues = z.infer<typeof leadCreateSchema>

interface LeadCreateFormProps {
    onSuccess?: () => void
}

interface DealerInfo {
    id: string;
    name: string;
    city: string;
    region: string | null;
}

export function LeadCreateForm({ onSuccess }: LeadCreateFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [allDealers, setAllDealers] = useState<DealerInfo[]>([])
    const [managers, setManagers] = useState<{ id: string, full_name: string, telegram_id?: number | null }[]>([])

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            try {
                const supabase = createClient()
                const { data: dealersData } = await supabase
                    .from('tenants')
                    .select('id, name, city, region')
                    .eq('status', 'active')
                    .order('name')

                if (dealersData) setAllDealers(dealersData)
            } catch (error) {
                console.error("Error fetching dealers:", error);
            }
        }
        fetchData()
    }, [])

    const form = useForm<LeadCreateValues>({
        resolver: zodResolver(leadCreateSchema),
        defaultValues: {
            name: "",
            phone: "+998",
            city: "",
            region: "",
            tenant_id: "",
            assigned_manager_id: "",
            source: "manual",
            status: "new",
            comment: ""
        },
    })

    const selectedCity = form.watch("city")
    const selectedTenantId = form.watch("tenant_id")
    const selectedRegion = form.watch("region")

    // Filtered lists
    const availableCities = useMemo(() => {
        return [...new Set(allDealers.map(d => d.city))].sort((a, b) => {
            const priorityA = a.includes("Tashkent") || a.includes("Ташкент")
                ? (a === "Tashkent" || a === "Ташкент" ? 2 : 1)
                : 0;
            const priorityB = b.includes("Tashkent") || b.includes("Ташкент")
                ? (b === "Tashkent" || b === "Ташкент" ? 2 : 1)
                : 0;

            if (priorityA > priorityB) return -1;
            if (priorityA < priorityB) return 1;

            return a.localeCompare(b);
        });
    }, [allDealers]);

    const availableRegions = useMemo(() => {
        if (!selectedCity) return [];
        const regions = allDealers
            .filter(d => d.city === selectedCity && d.region)
            .map(d => d.region as string);
        return [...new Set(regions)].sort();
    }, [allDealers, selectedCity]);

    const filteredDealers = useMemo(() => {
        if (!selectedCity) return [];
        if (!selectedRegion) {
            return allDealers.filter(d => d.city === selectedCity);
        }
        return allDealers.filter(d => d.city === selectedCity && d.region === selectedRegion);
    }, [allDealers, selectedCity, selectedRegion]);

    // Handlers
    const onCityChange = (val: string) => {
        form.setValue("city", val);
        form.setValue("region", "");
        form.setValue("tenant_id", "");
        form.setValue("assigned_manager_id", "");
    };

    const onRegionChange = (val: string) => {
        form.setValue("region", val);
        form.setValue("tenant_id", "");
        form.setValue("assigned_manager_id", "");

        const dealersInRegion = allDealers.filter(d => d.city === selectedCity && d.region === val);
        if (dealersInRegion.length === 1) {
            form.setValue("tenant_id", dealersInRegion[0].id);
        }
    };

    const onDealerChange = (val: string) => {
        form.setValue("tenant_id", val);
        const dealer = allDealers.find(d => d.id === val);
        if (dealer?.region && !selectedRegion) {
            form.setValue("region", dealer.region);
        }
        form.setValue("assigned_manager_id", "");
    };

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

    async function onSubmit(values: LeadCreateValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from("leads")
                .insert([{
                    name: values.name,
                    phone: values.phone,
                    city: values.city,
                    region: values.region || null,
                    tenant_id: values.tenant_id,
                    assigned_manager_id: values.assigned_manager_id || null,
                    source: values.source,
                    status: values.status,
                    comment: values.comment || null
                }])
                .select()
                .single()

            if (error) throw error

            // Create initial history record
            await supabase.from('lead_history').insert({
                lead_id: data.id,
                changed_by: user?.id,
                new_status: values.status,
                comment: 'Лид создан'
            })

            // Trigger notification
            if (data) {
                fetch('/api/leads/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: data.id })
                }).catch(e => console.error('Error notifying:', e));
            }

            toast.success("Лид успешно создан")

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
                                    Данные клиента
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
                                                    <Input className="pl-9" placeholder="Азиз" {...field} />
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
                                        <FormItem>
                                            <FormLabel>Город / Область</FormLabel>
                                            <Select onValueChange={onCityChange} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Выберите город" />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableCities.map(city => (
                                                        <SelectItem key={city} value={city}>{city}</SelectItem>
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
                                            <Select onValueChange={onRegionChange} value={field.value || ""} disabled={!selectedCity || availableRegions.length === 0}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder={!selectedCity ? "Выберите город" : (availableRegions.length === 0 ? "Нет районов" : "Выберите район")} />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableRegions.map(region => (
                                                        <SelectItem key={region} value={region}>{region}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Группа: Детали сделки */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    Детали сделки
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="tenant_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Филиал / Дилер</FormLabel>
                                            <Select onValueChange={onDealerChange} value={field.value || ""} disabled={!selectedCity}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Выберите дилера" />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {filteredDealers.map(dealer => (
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
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Источник</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Выберите источник" />
                                                        </div>
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
                                    name="assigned_manager_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ответственный менеджер</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedTenantId || managers.length === 0}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Выберите менеджера" />
                                                        </div>
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
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Статус заявки</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Выберите статус" />
                                                        </div>
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
                                Создать лид
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
