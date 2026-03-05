"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DynamicLeadForm from "@/components/forms/dynamic-lead-form";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FormConfig, Region, City } from "@/types/app";

export default function DynamicFormPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [language, setLanguage] = useState<'ru' | 'uz'>('ru');
    const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function loadData() {
            const supabase = createClient();

            // Load form config
            const { data: config } = await supabase
                .from('form_configs')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (!config) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setFormConfig(config);

            // Load regions and cities if city field is enabled
            if (config.enabled_fields.includes('city')) {
                const [regionsRes, citiesRes] = await Promise.all([
                    supabase
                        .from('regions')
                        .select('*')
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true }),
                    supabase
                        .from('cities')
                        .select('*')
                        .eq('is_active', true)
                        .order('sort_order', { ascending: true }),
                ]);
                setRegions(regionsRes.data || []);
                setCities(citiesRes.data || []);
            }

            setLoading(false);
        }
        loadData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
                    <p className="text-muted-foreground mt-2">Форма не найдена</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setLanguage('uz')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 shadow-md",
                            language === 'uz'
                                ? "bg-white dark:bg-black/40 ring-2 ring-blue-500 scale-105"
                                : "bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 opacity-70 hover:opacity-100 text-foreground/70"
                        )}
                        type="button"
                    >
                        <div className="w-6 h-6 rounded-full overflow-hidden relative">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Uzbekistan.svg"
                                alt="O'zbekcha"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-medium text-sm md:text-base">O&apos;zbekcha</span>
                    </button>

                    <button
                        onClick={() => setLanguage('ru')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 shadow-md",
                            language === 'ru'
                                ? "bg-white dark:bg-black/40 ring-2 ring-blue-500 scale-105"
                                : "bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 opacity-70 hover:opacity-100 text-foreground/70"
                        )}
                        type="button"
                    >
                        <div className="w-6 h-6 rounded-full overflow-hidden relative">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/en/f/f3/Flag_of_Russia.svg"
                                alt="Русский"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-medium text-sm md:text-base">Русский</span>
                    </button>
                </div>

                <DynamicLeadForm
                    formConfig={formConfig!}
                    regions={regions}
                    cities={cities}
                    language={language}
                />
            </div>

            <Toaster />
        </div>
    );
}
