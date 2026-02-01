"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "../../lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";

interface DealerLocation {
    city: string;
    region: string | null;
}

const translations = {
    ru: {
        title: "Узнать стоимость",
        subtitle: "Заполните форму, и мы подберем для вас лучшее предложение",
        nameLabel: "Ваше имя",
        namePlaceholder: "Азиз Азизов",
        phoneLabel: "Телефон",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Город / Область",
        cityPlaceholder: "Выберите город",
        regionLabel: "Район",
        regionPlaceholder: "Выберите район",
        submitButton: "Отправить заявку",
        submitting: "Отправка...",
        successTitle: "Заявка принята!",
        successDesc: "Спасибо, мы свяжемся с вами в ближайшее время.",
        sendMore: "Отправить еще одну заявку",
        validationName: "Имя должно содержать минимум 2 символа",
        validationPhone: "Введите корректный номер телефона",
        validationCity: "Выберите город",
        validationRegion: "Выберите район",
        noRegionsNeeded: "Район не требуется",
        loading: "Загрузка...",
    },
    uz: {
        title: "Narxini bilish",
        subtitle: "Formani to'ldiring va biz siz uchun eng yaxshi taklifni tanlaymiz",
        nameLabel: "Ismingiz",
        namePlaceholder: "Aziz Azizov",
        phoneLabel: "Telefon raqam",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Shahar / Viloyat",
        cityPlaceholder: "Shaharni tanlang",
        regionLabel: "Tuman",
        regionPlaceholder: "Tumanni tanlang",
        submitButton: "Ariza yuborish",
        submitting: "Yuborilmoqda...",
        successTitle: "Ariza qabul qilindi!",
        successDesc: "Rahmat, tez orada siz bilan bog'lanamiz.",
        sendMore: "Yana bir ariza yuborish",
        validationName: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
        validationPhone: "To'g'ri telefon raqamini kiriting",
        validationCity: "Shaharni tanlang",
        validationRegion: "Tumanni tanlang",
        noRegionsNeeded: "Tuman talab qilinmaydi",
        loading: "Yuklanmoqda...",
    }
};

interface LeadFormProps {
    language?: 'ru' | 'uz';
}

export default function LeadForm({ language = 'ru' }: LeadFormProps) {
    const t = translations[language];
    const [dealerLocations, setDealerLocations] = useState<DealerLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("");

    // Fetch available cities and regions from active dealers
    useEffect(() => {
        async function fetchDealerLocations() {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("tenants")
                    .select("city, region")
                    .eq("status", "active");

                if (error) throw error;

                setDealerLocations(data || []);
            } catch (error) {
                console.error("Error fetching dealer locations:", error);
                toast.error("Ошибка загрузки данных");
            } finally {
                setIsLoading(false);
            }
        }

        fetchDealerLocations();
    }, []);

    // Get unique cities from dealers
    const availableCities = useMemo(() => {
        const cities = [...new Set(dealerLocations.map(d => d.city))];
        return cities.sort((a, b) => {
            // Priority: Tashkent, Tashkent Region, then others Alphabetically
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
    }, [dealerLocations]);

    // Get regions for selected city
    const availableRegions = useMemo(() => {
        if (!selectedCity) return [];
        const regions = dealerLocations
            .filter(d => d.city === selectedCity && d.region)
            .map(d => d.region as string);
        return [...new Set(regions)].sort();
    }, [dealerLocations, selectedCity]);

    const formSchema = z.object({
        name: z.string().min(2, t.validationName),
        phone: z.string().min(9, t.validationPhone),
        city: z.string().min(1, t.validationCity),
        region: z.string().optional(),
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "+998",
            city: "",
            region: "",
        },
    });

    // Handle city change - reset region when city changes
    const handleCityChange = (value: string) => {
        setSelectedCity(value);
        form.setValue("city", value);
        form.setValue("region", "");
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const supabase = createClient();

            // Find the dealer for this city/region to auto-assign
            const matchingDealer = dealerLocations.find(
                d => d.city === values.city &&
                    (!values.region || d.region === values.region)
            );

            // Get dealer's tenant_id
            let tenantId = null;
            if (matchingDealer) {
                const { data: dealer } = await supabase
                    .from("tenants")
                    .select("id")
                    .eq("city", values.city)
                    .eq("status", "active")
                    .maybeSingle();

                if (dealer) {
                    tenantId = dealer.id;
                }
            }

            // Find managers and assign automatically
            let assignedManagerId = null;

            if (tenantId) {
                // 1. Get all active managers for this tenant
                const { data: managers } = await supabase
                    .from("users")
                    .select("id")
                    .eq("tenant_id", tenantId)
                    .eq("role", "manager")
                    .eq("is_active", true);

                if (managers && managers.length > 0) {
                    if (managers.length === 1) {
                        // Only one manager - assign directly
                        assignedManagerId = managers[0].id;
                    } else {
                        // Multiple managers - find the one with least active leads (Round Robin / Load Balancing)
                        const managerIds = managers.map(m => m.id);

                        // Get counts of active leads for these managers
                        const { data: leadsData } = await supabase
                            .from("leads")
                            .select("assigned_manager_id")
                            .in("assigned_manager_id", managerIds)
                            .in("status", ["new", "processing"]);

                        // Count leads per manager
                        const leadCounts: Record<string, number> = {};
                        managerIds.forEach(id => leadCounts[id] = 0);

                        leadsData?.forEach(lead => {
                            if (lead.assigned_manager_id) {
                                leadCounts[lead.assigned_manager_id] = (leadCounts[lead.assigned_manager_id] || 0) + 1;
                            }
                        });

                        // Find manager with minimum leads
                        let minLeads = Infinity;
                        let targetManager = managerIds[0];

                        managerIds.forEach(id => {
                            if (leadCounts[id] < minLeads) {
                                minLeads = leadCounts[id];
                                targetManager = id;
                            }
                        });

                        assignedManagerId = targetManager;
                    }
                }
            }

            const { data, error } = await supabase.from("leads").insert({
                name: values.name,
                phone: values.phone,
                city: values.city,
                region: values.region || null,
                tenant_id: tenantId,
                assigned_manager_id: assignedManagerId,
                source: 'website',
                status: assignedManagerId ? 'processing' : 'new' // If assigned, set to processing immediately? Or keep new? Best to keep 'new' so they see it. Let's keep 'new' but assigned.
            })
                .select()
                .single();

            if (error) throw error;

            // Trigger telegram notification
            if (data) {
                // If manager assigned, notify them specifically or generally notify admins
                await fetch('/api/leads/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: data.id })
                }).catch(e => console.error('Error notifying:', e));
            }

            setIsSuccess(true);
            toast.success("Заявка успешно отправлена!");
        } catch (error) {
            console.error(error);
            toast.error("Ошибка при отправке заявки. Попробуйте еще раз.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto mt-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-0 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                        {t.successTitle}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                        {t.successDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                    <Button
                        onClick={() => {
                            setIsSuccess(false);
                            setSelectedCity("");
                            form.reset();
                        }}
                        variant="outline"
                        className="mt-4"
                    >
                        {t.sendMore}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 shadow-2xl border-white/20 dark:border-white/10 ring-1 ring-white/30 dark:ring-white/10 py-6 !overflow-visible">
            <CardHeader className="!overflow-visible">
                <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    {t.title}
                </CardTitle>
                <CardDescription className="text-center text-base">
                    {t.subtitle}
                </CardDescription>
            </CardHeader>
            <CardContent className="!overflow-visible">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground/80">{t.nameLabel}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t.namePlaceholder}
                                            {...field}
                                            className="bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 transition-all h-14 text-lg"
                                        />
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
                                    <FormLabel className="text-foreground/80">{t.phoneLabel}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t.phonePlaceholder}
                                            {...field}
                                            className="bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 transition-all h-14 text-lg"
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, "");
                                                if (!value.startsWith("998")) {
                                                    value = "998" + value;
                                                }
                                                if (value.length > 12) {
                                                    value = value.slice(0, 12);
                                                }

                                                let formattedValue = "+998";
                                                if (value.length > 3) {
                                                    formattedValue += " " + value.slice(3, 5);
                                                }
                                                if (value.length > 5) {
                                                    formattedValue += " " + value.slice(5, 8);
                                                }
                                                if (value.length > 8) {
                                                    formattedValue += " " + value.slice(8, 10);
                                                }
                                                if (value.length > 10) {
                                                    formattedValue += " " + value.slice(10, 12);
                                                }

                                                field.onChange(formattedValue);
                                            }}
                                            maxLength={17}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground/80">{t.cityLabel}</FormLabel>
                                        <Select
                                            onValueChange={handleCityChange}
                                            value={selectedCity}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 transition-all !h-14 text-lg">
                                                    <SelectValue placeholder={isLoading ? t.loading : t.cityPlaceholder} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableCities.map((city) => (
                                                    <SelectItem
                                                        key={city}
                                                        value={city}
                                                        className="text-lg py-3 cursor-pointer"
                                                    >
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
                                    <FormItem className="w-full">
                                        <FormLabel className="text-foreground/80">{t.regionLabel}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!selectedCity || availableRegions.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 transition-all !h-14 text-lg">
                                                    <SelectValue
                                                        placeholder={
                                                            !selectedCity
                                                                ? t.cityPlaceholder
                                                                : availableRegions.length === 0
                                                                    ? t.noRegionsNeeded
                                                                    : t.regionPlaceholder
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableRegions.map((region) => (
                                                    <SelectItem
                                                        key={region}
                                                        value={region}
                                                        className="text-lg py-3 cursor-pointer"
                                                    >
                                                        {region}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                            disabled={isSubmitting || isLoading}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    {t.submitting}
                                </div>
                            ) : (
                                t.submitButton
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
