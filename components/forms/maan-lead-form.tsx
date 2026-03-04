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
import { toast } from "sonner";
import { useState, Suspense } from "react";
import { submitMaanLead } from "@/app/actions/maan-lead";
import { useLeadTracking } from "@/hooks/use-lead-tracking";
import { checkDuplicatePhone, type DuplicateLeadInfo } from "@/app/actions/check-duplicate";
import { DuplicateWarningDialog } from "@/components/dashboard/duplicate-warning-dialog";

const translations = {
    ru: {
        title: "Оставить заявку",
        subtitle: "Заполните форму, и мы свяжемся с вами",
        nameLabel: "Ваше имя",
        namePlaceholder: "Азиз Азизов",
        phoneLabel: "Телефон",
        phonePlaceholder: "+998 90 123 45 67",
        submitButton: "Отправить заявку",
        submitting: "Отправка...",
        successTitle: "Заявка принята!",
        successDesc: "Спасибо, мы свяжемся с вами в ближайшее время.",
        sendMore: "Отправить еще одну заявку",
        validationName: "Имя должно содержать минимум 2 символа",
        validationPhone: "Введите корректный номер телефона",
    },
    uz: {
        title: "Ariza qoldirish",
        subtitle: "Formani to'ldiring va biz siz bilan bog'lanamiz",
        nameLabel: "Ismingiz",
        namePlaceholder: "Aziz Azizov",
        phoneLabel: "Telefon raqam",
        phonePlaceholder: "+998 90 123 45 67",
        submitButton: "Ariza yuborish",
        submitting: "Yuborilmoqda...",
        successTitle: "Ariza qabul qilindi!",
        successDesc: "Rahmat, tez orada siz bilan bog'lanamiz.",
        sendMore: "Yana bir ariza yuborish",
        validationName: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
        validationPhone: "To'g'ri telefon raqamini kiriting",
    }
};

interface MaanLeadFormProps {
    language?: 'ru' | 'uz';
}

function MaanLeadFormInner({ language = 'ru' }: MaanLeadFormProps) {
    const t = translations[language];
    const trackingData = useLeadTracking();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateLeadInfo | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);

    const formSchema = z.object({
        name: z.string().min(2, t.validationName),
        phone: z.string().min(9, t.validationPhone),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "+998",
        },
    });

    async function doSubmitLead(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);

        try {
            const result = await submitMaanLead({
                name: values.name,
                phone: values.phone,
                tracking: trackingData,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setIsSuccess(true);
            toast.success(language === 'ru' ? "Заявка успешно отправлена!" : "Ariza muvaffaqiyatli yuborildi!");
        } catch (error) {
            console.error(error);
            toast.error(language === 'ru' ? "Ошибка при отправке заявки. Попробуйте еще раз." : "Arizani yuborishda xatolik. Qaytadan urinib ko'ring.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
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
            toast.error(language === 'ru' ? "Ошибка при отправке заявки. Попробуйте еще раз." : "Arizani yuborishda xatolik. Qaytadan urinib ko'ring.");
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

export default function MaanLeadForm({ language = 'ru' }: MaanLeadFormProps) {
    return (
        <Suspense>
            <MaanLeadFormInner language={language} />
        </Suspense>
    );
}
