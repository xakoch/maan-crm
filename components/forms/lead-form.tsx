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
import { useState } from "react";
import { submitPublicLead } from "@/app/actions/public-lead";

// Static Data
const ACTIVE_REGIONS_RU = [
    "Ташкент (город)",
    "Ташкентская область",
    "Кашкадарья",
    "Наманган",
    "Самарканд",
    "Джизак",
    "Сурхандарья"
] as const;

const ACTIVE_REGIONS_UZ = [
    "Toshkent shahar",
    "Toshkent viloyat",
    "Qashqadaryo",
    "Namangan",
    "Samarqand",
    "Jizzax",
    "Surxandaryo"
] as const;

const TASHKENT_DISTRICTS_RU = [
    "Бектемир",
    "Чиланзар",
    "Мирабад",
    "Мирзо-Улугбек",
    "Алмазар",
    "Сергели",
    "Шайхантахур",
    "Учтепа",
    "Яккасарай",
    "Яшнабад",
    "Юнусабад",
    "Янгихаёт"
] as const;

const TASHKENT_DISTRICTS_UZ = [
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

const translations = {
    ru: {
        title: "Узнать стоимость",
        subtitle: "Заполните форму, и мы подберем для вас лучшее предложение",
        nameLabel: "Ваше имя",
        namePlaceholder: "Азиз Азизов",
        phoneLabel: "Телефон",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Город / Область",
        cityPlaceholder: "Выберите регион",
        regionLabel: "Район",
        regionPlaceholder: "Выберите район",
        submitButton: "Отправить заявку",
        submitting: "Отправка...",
        successTitle: "Заявка принята!",
        successDesc: "Спасибо, мы свяжемся с вами в ближайшее время.",
        sendMore: "Отправить еще одну заявку",
        validationName: "Имя должно содержать минимум 2 символа",
        validationPhone: "Введите корректный номер телефона",
        validationCity: "Выберите регион",
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
        cityPlaceholder: "Hududni tanlang",
        regionLabel: "Tuman",
        regionPlaceholder: "Tumanni tanlang",
        submitButton: "Ariza yuborish",
        submitting: "Yuborilmoqda...",
        successTitle: "Ariza qabul qilindi!",
        successDesc: "Rahmat, tez orada siz bilan bog'lanamiz.",
        sendMore: "Yana bir ariza yuborish",
        validationName: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
        validationPhone: "To'g'ri telefon raqamini kiriting",
        validationCity: "Hududni tanlang",
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
    const [selectedCity, setSelectedCity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Select correct data based on language
    const ACTIVE_REGIONS = language === 'ru' ? ACTIVE_REGIONS_RU : ACTIVE_REGIONS_UZ;
    const TASHKENT_DISTRICTS = language === 'ru' ? TASHKENT_DISTRICTS_RU : TASHKENT_DISTRICTS_UZ;

    // Filter districts based on city selection
    // Using string matching for "Toshkent shahar" in UZ or "Ташкент (город)" in RU
    const isTashkent = selectedCity === "Toshkent shahar" || selectedCity === "Ташкент (город)";
    const availableRegions = isTashkent ? TASHKENT_DISTRICTS : [];

    const formSchema = z.object({
        name: z.string().min(2, t.validationName),
        phone: z.string().min(9, t.validationPhone),
        city: z.string().min(1, t.validationCity),
        region: z.string().optional(),
    });

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
        const isTashkentSubmit = values.city === "Toshkent shahar" || values.city === "Ташкент (город)";

        try {
            // Clean up region if not present in available list (e.g. if switched away from Tashkent)
            const submissionData = {
                ...values,
                region: (isTashkentSubmit && values.region) ? values.region : undefined
            };

            const result = await submitPublicLead(submissionData);

            if (!result.success) {
                throw new Error(result.error);
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
                                                if (value.length > 12) { value = value.slice(0, 12); }

                                                let formattedValue = "+998";
                                                if (value.length > 3) { formattedValue += " " + value.slice(3, 5); }
                                                if (value.length > 5) { formattedValue += " " + value.slice(5, 8); }
                                                if (value.length > 8) { formattedValue += " " + value.slice(8, 10); }
                                                if (value.length > 10) { formattedValue += " " + value.slice(10, 12); }

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
                                    <FormItem className={availableRegions.length > 0 ? "" : "md:col-span-2"}>
                                        <FormLabel className="text-foreground/80">{t.cityLabel}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <select
                                                    className="w-full h-14 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-md px-3 py-2 text-lg focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleCityChange(e.target.value);
                                                    }}
                                                >
                                                    <option value="" disabled className="text-muted-foreground">{t.cityPlaceholder}</option>
                                                    {ACTIVE_REGIONS.map((city) => (
                                                        <option key={city} value={city} className="text-black dark:text-white bg-white dark:bg-zinc-900">
                                                            {city}
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

                            {availableRegions.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="region"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-foreground/80">{t.regionLabel}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <select
                                                        className="w-full h-14 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-md px-3 py-2 text-lg focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50"
                                                        {...field}
                                                    >
                                                        <option value="" disabled className="text-muted-foreground">
                                                            {t.regionPlaceholder}
                                                        </option>
                                                        {availableRegions.map((region) => (
                                                            <option key={region} value={region} className="text-black dark:text-white bg-white dark:bg-zinc-900">
                                                                {region}
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
        </Card>
    );
}
