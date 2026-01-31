"use client";

import { useState } from "react";
import LeadForm from "@/components/forms/lead-form";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export default function LeadFormPage() {
    const [language, setLanguage] = useState<'ru' | 'uz'>('ru');

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 relative overflow-hidden">
            {/* Decorative background elements */}
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
                        <span className="font-medium text-sm md:text-base">O'zbekcha</span>
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

                <LeadForm language={language} />
            </div>

            <Toaster />
        </div>
    );
}
