"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
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
    city: z.string().min(1, "Город обязателен"),
    region: z.string().optional(),
    tenant_id: z.string().min(1, "Выберите дилера"),
    assigned_manager_id: z.string().optional(),
    source: z.string().min(1, "Источник обязателен"),
    status: z.enum(['new', 'processing', 'closed', 'rejected']),
    comment: z.string().optional(),
})

type LeadCreateValues = z.infer<typeof leadCreateSchema>

interface DealerInfo {
    id: string;
    name: string;
    city: string;
    region: string | null;
}

export function LeadCreateForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [allDealers, setAllDealers] = useState<DealerInfo[]>([])
    const [managers, setManagers] = useState<{ id: string, full_name: string, telegram_id?: number | null }[]>([])

    const form = useForm<LeadCreateValues>({
        resolver: zodResolver(leadCreateSchema),
        defaultValues: {
            name: "",
            phone: "+998",
            city: "",
            region: "",
            tenant_id: "",
            assigned_manager_id: "",
            status: 'new' as const,
            source: 'manual',
            comment: ""
        },
    })

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
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
            } finally {
                setIsLoading(false);
            }
        }
        fetchData()
    }, [])

    const selectedCity = form.watch("city")
    const selectedTenantId = form.watch("tenant_id")

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

    const filteredDealers = useMemo(() => {
        if (!selectedCity) return [];
        return allDealers.filter(d => d.city === selectedCity);
    }, [allDealers, selectedCity]);

    // Handle city change
    const onCityChange = (val: string) => {
        form.setValue("city", val);
        form.setValue("tenant_id", "");
        form.setValue("region", "");
        form.setValue("assigned_manager_id", "");
    };

    // Handle dealer change
    const onDealerChange = (val: string) => {
        form.setValue("tenant_id", val);
        const dealer = allDealers.find(d => d.id === val);
        if (dealer?.region) {
            form.setValue("region", dealer.region);
        } else {
            form.setValue("region", "");
        }
        form.setValue("assigned_manager_id", "");
    };

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

            // Trigger telegram notification
            if (data) {
                fetch('/api/leads/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: data.id })
                }).catch(e => console.error('Error notifying:', e));
            }

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
                                    <Input placeholder="Азиз Азизов" {...field} />
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
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Город / Область</FormLabel>
                                <Select onValueChange={onCityChange} value={field.value || ""} disabled={isLoading}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoading ? "Загрузка..." : "Выберите город"} />
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
                        name="tenant_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Филиал / Дилер</FormLabel>
                                <Select onValueChange={onDealerChange} value={field.value || ""} disabled={!selectedCity}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!selectedCity ? "Сначала выберите город" : "Выберите дилера"} />
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
                        name="region"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Район (из данных дилера)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Район не указан"
                                        {...field}
                                        value={field.value || ""}
                                        readOnly
                                        className="bg-muted"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="assigned_manager_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Менеджер (опционально)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedTenantId || managers.length === 0}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={managers.length === 0 ? (selectedTenantId ? "Нет активных менеджеров" : "Выберите дилера") : "Выберите менеджера"} />
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
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Источник</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "manual"}>
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
                                <Select onValueChange={field.onChange} value={field.value || "new"}>
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
                                <Textarea className="min-h-[100px]" placeholder="Дополнительная информация..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isSubmitting || isLoading}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать лид
                </Button>
            </form>
        </Form>
    )
}
