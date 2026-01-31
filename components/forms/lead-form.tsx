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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "../../lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const cities = [
    { value: "Tashkent", label: "Ташкент" },
    { value: "Samarkand", label: "Самарканд" },
    { value: "Bukhara", label: "Бухара" },
    { value: "Andijan", label: "Андижан" },
    { value: "Fergana", label: "Фергана" },
    { value: "Namangan", label: "Наманган" },
    { value: "Navoi", label: "Навои" },
    { value: "Urgench", label: "Ургенч" },
    { value: "Nukus", label: "Нукус" },
    { value: "Termez", label: "Термез" },
    { value: "Qarshi", label: "Карши" },
    { value: "Jizzakh", label: "Джизак" },
    { value: "Gulistan", label: "Гулистан" },
];

const regions = [
    { value: "Yunusabad", label: "Юнусабадский" },
    { value: "Mirzo Ulugbek", label: "Мирзо-Улугбекский" },
    { value: "Chilanzar", label: "Чиланзарский" },
    { value: "Yashnobod", label: "Яшнабадский" },
    { value: "Mirabad", label: "Мирабадский" },
    { value: "Shaykhontohur", label: "Шайхантахурский" },
    { value: "Almazar", label: "Алмазарский" },
    { value: "Sergeli", label: "Сергелийский" },
    { value: "Yakkasaroy", label: "Яккасарайский" },
    { value: "Uchtepa", label: "Учтепинский" },
    { value: "Bektemir", label: "Бектемирский" },
    { value: "Yangihayot", label: "Янгихаётский" },
];

const translations = {
    ru: {
        title: "Узнать стоимость",
        subtitle: "Заполните форму, и мы подберем для вас лучшее предложение",
        nameLabel: "Ваше имя",
        namePlaceholder: "Азиз Азизов",
        phoneLabel: "Телефон",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Город",
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
        validationCity: "Введите название города",
        validationRegion: "Выберите район",
        cities: [
            { value: "Tashkent", label: "Ташкент" },
            { value: "Samarkand", label: "Самарканд" },
            { value: "Bukhara", label: "Бухара" },
            { value: "Andijan", label: "Андижан" },
            { value: "Fergana", label: "Фергана" },
            { value: "Namangan", label: "Наманган" },
            { value: "Navoi", label: "Навои" },
            { value: "Urgench", label: "Ургенч" },
            { value: "Nukus", label: "Нукус" },
            { value: "Termez", label: "Термез" },
            { value: "Qarshi", label: "Карши" },
            { value: "Jizzakh", label: "Джизак" },
            { value: "Gulistan", label: "Гулистан" },
        ],
        regions: [
            { value: "Yunusabad", label: "Юнусабадский" },
            { value: "Mirzo Ulugbek", label: "Мирзо-Улугбекский" },
            { value: "Chilanzar", label: "Чиланзарский" },
            { value: "Yashnobod", label: "Яшнабадский" },
            { value: "Mirabad", label: "Мирабадский" },
            { value: "Shaykhontohur", label: "Шайхантахурский" },
            { value: "Almazar", label: "Алмазарский" },
            { value: "Sergeli", label: "Сергелийский" },
            { value: "Yakkasaroy", label: "Яккасарайский" },
            { value: "Uchtepa", label: "Учтепинский" },
            { value: "Bektemir", label: "Бектемирский" },
            { value: "Yangihayot", label: "Янгихаётский" },
        ]
    },
    uz: {
        title: "Narxini bilish",
        subtitle: "Formani to'ldiring va biz siz uchun eng yaxshi taklifni tanlaymiz",
        nameLabel: "Ismingiz",
        namePlaceholder: "Aziz Azizov",
        phoneLabel: "Telefon raqam",
        phonePlaceholder: "+998 90 123 45 67",
        cityLabel: "Shahar",
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
        cities: [
            { value: "Tashkent", label: "Toshkent" },
            { value: "Samarkand", label: "Samarqand" },
            { value: "Bukhara", label: "Buxoro" },
            { value: "Andijan", label: "Andijon" },
            { value: "Fergana", label: "Farg'ona" },
            { value: "Namangan", label: "Namangan" },
            { value: "Navoi", label: "Navoiy" },
            { value: "Urgench", label: "Urganch" },
            { value: "Nukus", label: "Nukus" },
            { value: "Termez", label: "Termiz" },
            { value: "Qarshi", label: "Qarshi" },
            { value: "Jizzakh", label: "Jizzax" },
            { value: "Gulistan", label: "Guliston" },
        ],
        regions: [
            { value: "Yunusabad", label: "Yunusobod" },
            { value: "Mirzo Ulugbek", label: "Mirzo Ulug'bek" },
            { value: "Chilanzar", label: "Chilonzor" },
            { value: "Yashnobod", label: "Yashnobod" },
            { value: "Mirabad", label: "Mirobod" },
            { value: "Shaykhontohur", label: "Shayxontohur" },
            { value: "Almazar", label: "Olmazor" },
            { value: "Sergeli", label: "Sergeli" },
            { value: "Yakkasaroy", label: "Yakkasaroy" },
            { value: "Uchtepa", label: "Uchtepa" },
            { value: "Bektemir", label: "Bektemir" },
            { value: "Yangihayot", label: "Yangihayot" },
        ]
    }
};

interface LeadFormProps {
    language?: 'ru' | 'uz';
}

export default function LeadForm({ language = 'ru' }: LeadFormProps) {
    const t = translations[language];

    const formSchema = z.object({
        name: z.string().min(2, t.validationName),
        phone: z.string().min(9, t.validationPhone),
        city: z.string().min(2, t.validationCity),
        region: z.string().min(2, t.validationRegion),
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "+998",
            city: "",
            region: "",
        },
    });

    // Reset form validation when language changes to update error messages
    // trigger re-validation if needed, or just let it be until next submit

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const supabase = createClient();

            const { error } = await supabase.from("leads").insert({
                name: values.name,
                phone: values.phone,
                city: values.city,
                region: values.region || null,
                source: 'website',
                status: 'new'
            });

            if (error) throw error;

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
        <Card className="w-full max-w-lg mx-auto backdrop-blur-3xl bg-white/70 dark:bg-black/40 shadow-2xl border-white/20 dark:border-white/10 ring-1 ring-white/30 dark:ring-white/10 py-6">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    {t.title}
                </CardTitle>
                <CardDescription className="text-center text-base">
                    {t.subtitle}
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 transition-all !h-14 text-lg">
                                                    <SelectValue placeholder={t.cityPlaceholder} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {t.cities.map((city) => (
                                                    <SelectItem
                                                        key={city.value}
                                                        value={city.value}
                                                        className="text-lg py-3 cursor-pointer"
                                                    >
                                                        {city.label}
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 transition-all !h-14 text-lg">
                                                    <SelectValue placeholder={t.regionPlaceholder} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {t.regions.map((region) => (
                                                    <SelectItem
                                                        key={region.value}
                                                        value={region.value}
                                                        className="text-lg py-3 cursor-pointer"
                                                    >
                                                        {region.label}
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
