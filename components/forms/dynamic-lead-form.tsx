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
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useState, Suspense } from "react";
import { submitFormLead } from "@/app/actions/submit-form-lead";
import { useLeadTracking } from "@/hooks/use-lead-tracking";
import { checkDuplicatePhone, type DuplicateLeadInfo } from "@/app/actions/check-duplicate";
import { DuplicateWarningDialog } from "@/components/dashboard/duplicate-warning-dialog";
import { FormConfig, Region, City } from "@/types/app";
import { SERVICES } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";

const translations = {
    ru: {
        nameLabel: "Ваше имя",
        namePlaceholder: "Азиз Азизов",
        phoneLabel: "Телефон",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Город / Область",
        cityPlaceholder: "Выберите регион",
        districtLabel: "Район",
        districtPlaceholder: "Выберите район",
        servicesLabel: "Услуги",
        submitButton: "Отправить заявку",
        submitting: "Отправка...",
        successTitle: "Заявка принята!",
        successDesc: "Спасибо, мы свяжемся с вами в ближайшее время.",
        sendMore: "Отправить еще одну заявку",
        validationName: "Имя должно содержать минимум 2 символа",
        validationPhone: "Введите корректный номер телефона",
        validationCity: "Выберите регион",
    },
    uz: {
        nameLabel: "Ismingiz",
        namePlaceholder: "Aziz Azizov",
        phoneLabel: "Telefon raqam",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Shahar / Viloyat",
        cityPlaceholder: "Hududni tanlang",
        districtLabel: "Tuman",
        districtPlaceholder: "Tumanni tanlang",
        servicesLabel: "Xizmatlar",
        submitButton: "Ariza yuborish",
        submitting: "Yuborilmoqda...",
        successTitle: "Ariza qabul qilindi!",
        successDesc: "Rahmat, tez orada siz bilan bog'lanamiz.",
        sendMore: "Yana bir ariza yuborish",
        validationName: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
        validationPhone: "To'g'ri telefon raqamini kiriting",
        validationCity: "Hududni tanlang",
    },
};

interface DynamicLeadFormProps {
    formConfig: FormConfig;
    regions: Region[];
    cities: City[];
    language?: 'ru' | 'uz';
}

function DynamicLeadFormInner({ formConfig, regions, cities, language = 'ru' }: DynamicLeadFormProps) {
    const t = translations[language];
    const trackingData = useLeadTracking();
    const [selectedRegion, setSelectedRegion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateLeadInfo | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [pendingValues, setPendingValues] = useState<any>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const enabledFields = formConfig.enabled_fields;
    const hasCity = enabledFields.includes("city");
    const hasServices = enabledFields.includes("services");

    // Find selected region data
    const selectedRegionData = regions.find(r =>
        language === 'ru' ? r.name_ru === selectedRegion : r.name_uz === selectedRegion
    );
    const regionCities = selectedRegionData?.has_districts
        ? cities.filter(c => c.region === selectedRegionData.slug)
        : [];

    // Build schema based on enabled fields
    const formSchema = hasCity
        ? z.object({
            name: z.string().min(2, t.validationName),
            phone: z.string().min(9, t.validationPhone),
            city: z.string().min(1, t.validationCity),
            district: z.string().optional(),
        })
        : z.object({
            name: z.string().min(2, t.validationName),
            phone: z.string().min(9, t.validationPhone),
        });

    type FormValues = { name: string; phone: string; city?: string; district?: string };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "+998",
            ...(hasCity ? { city: "", district: "" } : {}),
        },
    });

    function handleCityChange(value: string) {
        setSelectedRegion(value);
        form.setValue("city" as any, value);
        if (hasCity) {
            form.setValue("district" as any, "");
        }
    }

    async function doSubmitLead(values: any) {
        setIsSubmitting(true);
        try {
            const result = await submitFormLead({
                name: values.name,
                phone: values.phone,
                city: values.city || undefined,
                region: values.district || undefined,
                services: hasServices ? selectedServices : undefined,
                formConfigId: formConfig.id,
                crmType: formConfig.crm_type,
                tracking: trackingData,
            });

            if (!result.success) throw new Error(result.error);

            setIsSuccess(true);
            toast.success(language === 'ru' ? "Заявка успешно отправлена!" : "Ariza muvaffaqiyatli yuborildi!");
        } catch (error) {
            console.error(error);
            toast.error(language === 'ru' ? "Ошибка при отправке заявки." : "Arizani yuborishda xatolik.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onSubmit(values: any) {
        setIsSubmitting(true);
        try {
            const duplicate = await checkDuplicatePhone(values.phone);
            if (duplicate) {
                setDuplicateInfo(duplicate);
                setPendingValues(values);
                setShowDuplicateDialog(true);
                setIsSubmitting(false);
                return;
            }
            await doSubmitLead(values);
        } catch (error) {
            console.error(error);
            toast.error(language === 'ru' ? "Ошибка при отправке заявки." : "Arizani yuborishda xatolik.");
            setIsSubmitting(false);
        }
    }

    const title = language === 'ru' ? formConfig.title_ru : formConfig.title_uz;
    const subtitle = language === 'ru' ? formConfig.subtitle_ru : formConfig.subtitle_uz;

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto mt-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-0 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                            setSelectedRegion("");
                            setSelectedServices([]);
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
                    {title}
                </CardTitle>
                {subtitle && (
                    <CardDescription className="text-center text-base">
                        {subtitle}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="!overflow-visible">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Name */}
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

                        {/* Phone */}
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
                                                if (!value.startsWith("998")) value = "998" + value;
                                                if (value.length > 12) value = value.slice(0, 12);
                                                let formattedValue = "+998";
                                                if (value.length > 3) formattedValue += " " + value.slice(3, 5);
                                                if (value.length > 5) formattedValue += " " + value.slice(5, 8);
                                                if (value.length > 8) formattedValue += " " + value.slice(8, 10);
                                                if (value.length > 10) formattedValue += " " + value.slice(10, 12);
                                                field.onChange(formattedValue);
                                            }}
                                            maxLength={17}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* City/Region */}
                        {hasCity && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className={regionCities.length > 0 ? "" : "md:col-span-2"}>
                                            <FormLabel className="text-foreground/80">{t.cityLabel}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <select
                                                        className="w-full h-14 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-md px-3 py-2 text-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleCityChange(e.target.value);
                                                        }}
                                                    >
                                                        <option value="" disabled>{t.cityPlaceholder}</option>
                                                        {regions.map((region) => (
                                                            <option key={region.id} value={language === 'ru' ? region.name_ru : region.name_uz}>
                                                                {language === 'ru' ? region.name_ru : region.name_uz}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-5 h-4 w-4 opacity-50 pointer-events-none" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {regionCities.length > 0 && (
                                    <FormField
                                        control={form.control}
                                        name="district"
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel className="text-foreground/80">{t.districtLabel}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full h-14 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-md px-3 py-2 text-lg focus:ring-2 focus:ring-indigo-500 appearance-none"
                                                            {...field}
                                                        >
                                                            <option value="" disabled>{t.districtPlaceholder}</option>
                                                            {regionCities.map((city) => (
                                                                <option key={city.id} value={language === 'ru' ? city.name_ru : city.name_uz}>
                                                                    {language === 'ru' ? city.name_ru : city.name_uz}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-5 h-4 w-4 opacity-50 pointer-events-none" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {/* Services */}
                        {hasServices && (
                            <div>
                                <FormLabel className="text-foreground/80 mb-3 block">{t.servicesLabel}</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {SERVICES.map(service => (
                                        <div key={service} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`service-${service}`}
                                                checked={selectedServices.includes(service)}
                                                onCheckedChange={(checked: boolean | "indeterminate") => {
                                                    setSelectedServices(prev =>
                                                        checked
                                                            ? [...prev, service]
                                                            : prev.filter(s => s !== service)
                                                    );
                                                }}
                                            />
                                            <label htmlFor={`service-${service}`} className="text-sm">
                                                {service}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                            disabled={isSubmitting}
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

            <DuplicateWarningDialog
                open={showDuplicateDialog}
                onOpenChange={setShowDuplicateDialog}
                duplicate={duplicateInfo}
                onConfirm={() => {
                    setShowDuplicateDialog(false);
                    if (pendingValues) doSubmitLead(pendingValues);
                }}
            />
        </Card>
    );
}

export default function DynamicLeadForm(props: DynamicLeadFormProps) {
    return (
        <Suspense>
            <DynamicLeadFormInner {...props} />
        </Suspense>
    );
}
