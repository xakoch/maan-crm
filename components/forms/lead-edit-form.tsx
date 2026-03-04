"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, User, Phone, MapPin, Building2, Globe, Activity, MessageSquare, Banknote, XCircle, UserCheck, Radar, Tag, Plus, ArrowRight, Clock, UserPlus, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { autoCreateClientFromLead } from "@/app/actions/auto-create-client"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SERVICES } from "@/lib/constants"

const leadEditSchema = z.object({
    name: z.string().min(2, "Имя обязательно"),
    phone: z.string().min(9, "Телефон обязателен"),
    city: z.string().min(1, "Город обязателен"),
    region: z.string().optional(),
    tenant_id: z.string().min(1, "Выберите дилера"),
    assigned_manager_id: z.string().optional(),
    source: z.string().min(1, "Источник обязателен"),
    status: z.enum(['new', 'processing', 'closed', 'rejected']),
    comment: z.string().optional(),
    rejection_reason: z.string().optional(),
    conversion_value: z.number().optional(),
    lead_type: z.enum(['person', 'organization']),
    company_name: z.string().optional(),
    services: z.array(z.string()).optional(),
})

type LeadEditValues = z.infer<typeof leadEditSchema>

interface LeadEditFormProps {
    lead: any // Type from DB
    history?: any[]
    onSuccess?: () => void
    backUrl?: string
}

interface DealerInfo {
    id: string;
    name: string;
    city: string;
    region: string | null;
}

export function LeadEditForm({ lead, history = [], onSuccess, backUrl = "/dashboard/leads" }: LeadEditFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [allDealers, setAllDealers] = useState<DealerInfo[]>([])
    const [managers, setManagers] = useState<{ id: string, full_name: string, telegram_id?: number | null }[]>([])

    // Fetch dealers for select
    useEffect(() => {
        async function fetchDealers() {
            const supabase = createClient()
            const { data } = await supabase
                .from('tenants')
                .select('id, name, city, region')
                .eq('status', 'active')
                .order('name')

            if (data) setAllDealers(data)
        }
        fetchDealers()
    }, [])

    const form = useForm<LeadEditValues>({
        resolver: zodResolver(leadEditSchema),
        defaultValues: {
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
            region: lead.region || "",
            tenant_id: lead.tenant_id || "",
            assigned_manager_id: lead.assigned_manager_id || "",
            source: lead.source || "manual",
            status: lead.status || "new",
            comment: lead.comment || "",
            rejection_reason: lead.rejection_reason || "",
            conversion_value: lead.conversion_value || 0,
            lead_type: lead.lead_type || "person",
            company_name: lead.company_name || "",
            services: lead.services || [],
        },
    })

    const selectedCity = form.watch("city")
    const selectedTenantId = form.watch("tenant_id")
    const selectedStatus = form.watch("status")
    const selectedRegion = form.watch("region")
    const leadType = form.watch("lead_type")

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

    async function onSubmit(values: LeadEditValues) {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            // Clean up optional fields based on status
            const updates = {
                ...values,
                assigned_manager_id: values.assigned_manager_id || null,
                rejection_reason: values.status === 'rejected' ? values.rejection_reason : null,
                conversion_value: values.conversion_value || null,
                closed_at: values.status === 'closed' && lead.status !== 'closed' ? new Date().toISOString() : (values.status !== 'closed' ? null : lead.closed_at),
                updated_at: new Date().toISOString(),
                lead_type: values.lead_type,
                company_name: values.company_name || null,
                services: values.services || [],
            }

            const { error } = await supabase
                .from("leads")
                .update(updates)
                .eq('id', lead.id)

            if (error) throw error

            // Track changes for history
            const { data: { user } } = await supabase.auth.getUser()
            const statusChanged = values.status !== lead.status
            const managerChanged = values.assigned_manager_id !== (lead.assigned_manager_id || "") // Handle null/empty string diff

            if (statusChanged) {
                await supabase.from('lead_history').insert({
                    lead_id: lead.id,
                    changed_by: user?.id,
                    old_status: lead.status,
                    new_status: values.status,
                    comment: values.comment !== lead.comment ? 'Статус изменен + комментарий' : 'Статус изменен'
                })
            }

            if (managerChanged) {
                const oldManagerName = lead.assigned_manager?.full_name || 'Не назначен';
                const newManager = managers.find(m => m.id === values.assigned_manager_id);
                const newManagerName = newManager?.full_name || 'Не назначен';

                await supabase.from('lead_history').insert({
                    lead_id: lead.id,
                    changed_by: user?.id,
                    old_status: values.status, // Status might keep same, but we record snapshot
                    new_status: values.status,
                    comment: `Менеджер: ${oldManagerName} -> ${newManagerName}`
                })

                // Notify new manager if assigned
                if (values.assigned_manager_id) {
                    fetch('/api/leads/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId: lead.id }) // Start command will handle finding the new manager from lead
                    }).catch(e => console.error('Error notifying:', e));
                }
            }

            if (!statusChanged && !managerChanged && values.comment !== lead.comment) {
                await supabase.from('lead_history').insert({
                    lead_id: lead.id,
                    changed_by: user?.id,
                    old_status: lead.status,
                    new_status: lead.status,
                    comment: 'Комментарий обновлен'
                })
            }

            // Auto-create client when lead is closed
            if (statusChanged && values.status === 'closed') {
                const clientResult = await autoCreateClientFromLead(lead.id)
                if (clientResult.success && !clientResult.alreadyExists) {
                    toast.success("Клиент автоматически создан из лида")
                }
            }

            toast.success("Лид обновлен")
            router.refresh()

            if (onSuccess) {
                onSuccess()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при обновлении лида")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function onDelete() {
        setIsDeleting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', lead.id)

            if (error) throw error

            toast.success("Лид удален")

            if (onSuccess) {
                onSuccess()
            } else {
                router.push(backUrl)
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ошибка при удалении")
            setIsDeleting(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
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

                        {/* Услуги и сумма сделки */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    Услуги и сумма
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="services"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Услуги</FormLabel>
                                            <div className="flex flex-wrap gap-2">
                                                {SERVICES.map((service) => {
                                                    const isSelected = field.value?.includes(service)
                                                    return (
                                                        <Badge
                                                            key={service}
                                                            variant={isSelected ? "default" : "outline"}
                                                            className="cursor-pointer select-none transition-colors"
                                                            onClick={() => {
                                                                const current = field.value || []
                                                                if (isSelected) {
                                                                    field.onChange(current.filter((s: string) => s !== service))
                                                                } else {
                                                                    field.onChange([...current, service])
                                                                }
                                                            }}
                                                        >
                                                            {service}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="conversion_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Сумма сделки (сум)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Banknote className="absolute left-2.5 top-2.5 h-4 w-4 text-green-600" />
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="pl-9"
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {selectedStatus === 'rejected' && (
                            <Card className="border-red-500/30 bg-red-50/50 dark:bg-red-900/10">
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="rejection_reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Причина отказа</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <XCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-red-600" />
                                                        <Input className="pl-9" placeholder="Клиент передумал..." {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Данные отслеживания */}
                        {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.referrer_url || lead.device_type || lead.browser || lead.landing_page_url) && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Radar className="h-4 w-4 text-primary" />
                                        Данные отслеживания
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                                        {lead.utm_source && (
                                            <div>
                                                <span className="text-muted-foreground">UTM Source:</span>{" "}
                                                <span className="font-medium">{lead.utm_source}</span>
                                            </div>
                                        )}
                                        {lead.utm_medium && (
                                            <div>
                                                <span className="text-muted-foreground">UTM Medium:</span>{" "}
                                                <span className="font-medium">{lead.utm_medium}</span>
                                            </div>
                                        )}
                                        {lead.utm_campaign && (
                                            <div>
                                                <span className="text-muted-foreground">UTM Campaign:</span>{" "}
                                                <span className="font-medium">{lead.utm_campaign}</span>
                                            </div>
                                        )}
                                        {lead.utm_content && (
                                            <div>
                                                <span className="text-muted-foreground">UTM Content:</span>{" "}
                                                <span className="font-medium">{lead.utm_content}</span>
                                            </div>
                                        )}
                                        {lead.utm_term && (
                                            <div>
                                                <span className="text-muted-foreground">UTM Term:</span>{" "}
                                                <span className="font-medium">{lead.utm_term}</span>
                                            </div>
                                        )}
                                        {lead.referrer_url && (
                                            <div className="md:col-span-2">
                                                <span className="text-muted-foreground">Referrer:</span>{" "}
                                                <span className="font-medium break-all">{lead.referrer_url}</span>
                                            </div>
                                        )}
                                        {lead.landing_page_url && (
                                            <div className="md:col-span-2">
                                                <span className="text-muted-foreground">Landing Page:</span>{" "}
                                                <span className="font-medium break-all">{lead.landing_page_url}</span>
                                            </div>
                                        )}
                                        {lead.device_type && (
                                            <div>
                                                <span className="text-muted-foreground">Устройство:</span>{" "}
                                                <span className="font-medium">{lead.device_type}</span>
                                            </div>
                                        )}
                                        {lead.browser && (
                                            <div>
                                                <span className="text-muted-foreground">Браузер:</span>{" "}
                                                <span className="font-medium">{lead.browser}</span>
                                            </div>
                                        )}
                                        {lead.ip_address && (
                                            <div>
                                                <span className="text-muted-foreground">IP:</span>{" "}
                                                <span className="font-medium">{lead.ip_address}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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

                        <div className="flex justify-between items-center sticky bottom-0 bg-background py-4 border-t mt-8 z-10">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить изменения
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" type="button" disabled={isDeleting}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Удалить лид
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Это действие нельзя отменить. Лид будет удален из базы данных навсегда.
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
                        </div>
                    </form>
                </Form>
            </div>

            <div className="space-y-6">
                {/* Информация о лиде */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Информация о лиде
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Создан</span>
                            <span className="font-medium">{format(new Date(lead.created_at), "d MMM yyyy HH:mm", { locale: ru })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Источник</span>
                            <span className="font-medium">{lead.source || "—"}</span>
                        </div>
                        {lead.device_type && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Устройство</span>
                                <span className="font-medium">{lead.device_type}</span>
                            </div>
                        )}
                        {lead.browser && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Браузер</span>
                                <span className="font-medium">{lead.browser}</span>
                            </div>
                        )}
                        {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                            <div className="pt-2 border-t mt-2 space-y-1">
                                <span className="text-xs text-muted-foreground font-medium uppercase">UTM-метки</span>
                                {lead.utm_source && <div className="text-xs"><span className="text-muted-foreground">source:</span> {lead.utm_source}</div>}
                                {lead.utm_medium && <div className="text-xs"><span className="text-muted-foreground">medium:</span> {lead.utm_medium}</div>}
                                {lead.utm_campaign && <div className="text-xs"><span className="text-muted-foreground">campaign:</span> {lead.utm_campaign}</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* История изменений */}
                <div className="sticky top-6 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        История изменений
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {history.length === 0 && <p className="text-sm text-muted-foreground">История пуста</p>}
                        {history.map((record: any) => {
                            const isCreation = record.comment?.includes('Лид создан') || record.comment?.includes('создан')
                            const isManagerChange = record.comment?.includes('Менеджер:')
                            const isStatusChange = record.old_status && record.new_status && record.old_status !== record.new_status

                            const getEventIcon = () => {
                                if (isCreation) return <Plus className="h-3 w-3 text-green-600" />
                                if (isManagerChange) return <UserPlus className="h-3 w-3 text-blue-600" />
                                if (isStatusChange) return <ArrowRight className="h-3 w-3 text-orange-600" />
                                return <FileText className="h-3 w-3 text-muted-foreground" />
                            }

                            const getEventColor = () => {
                                if (isCreation) return "bg-green-500"
                                if (isManagerChange) return "bg-blue-500"
                                if (isStatusChange) return "bg-orange-500"
                                return "bg-primary"
                            }

                            const getEventTitle = () => {
                                if (isCreation) return "Лид создан"
                                if (isManagerChange) return "Назначение менеджера"
                                if (isStatusChange) return `${record.old_status} → ${record.new_status}`
                                return record.new_status ? `Статус: ${record.new_status}` : "Изменение"
                            }

                            return (
                                <div key={record.id} className="relative pb-4 pl-6 border-l last:border-0 border-gray-200 dark:border-gray-800">
                                    <div className={`absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full ${getEventColor()}`} />
                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                        {getEventIcon()}
                                        {getEventTitle()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(record.created_at), "d MMM yyyy HH:mm", { locale: ru })}
                                    </div>
                                    {record.users && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Автор: {record.users.full_name}
                                        </div>
                                    )}
                                    {record.comment && !isCreation && (
                                        <div className="text-sm mt-1 bg-muted p-2 rounded-md">
                                            {record.comment}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
