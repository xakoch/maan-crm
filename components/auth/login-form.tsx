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
import { createClient } from "../../lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// Обновленная схема валидации
const formSchema = z.object({
    // Изменили валидацию: либо email, либо строка минимум 2 символа (юзернейм)
    login: z.string().min(2, "Введите Email или Имя пользователя"),
    password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export default function LoginForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            login: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const supabase = createClient();
            let emailToSignIn = values.login;

            // 1. Проверяем, является ли ввод Email-ом
            const isEmail = values.login.includes("@");

            // 2. Если это НЕ Email, ищем email по username в нашей таблице users
            if (!isEmail) {
                // Ищем пользователя по username
                const { data: user, error: userError } = await supabase
                    .from("users")
                    .select("email")
                    .eq("username", values.login)
                    .single();

                if (userError || !user) {
                    throw new Error("Пользователь с таким именем не найден");
                }

                emailToSignIn = user.email;
            }

            // 3. Выполняем вход через Supabase Auth (используя всегда Email)
            const { error } = await supabase.auth.signInWithPassword({
                email: emailToSignIn,
                password: values.password,
            });

            if (error) {
                throw error;
            }

            toast.success("Вход выполнен успешно!");
            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message === "Invalid login credentials"
                ? "Неверный логин или пароль"
                : error.message || "Ошибка входа";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto backdrop-blur-3xl bg-white/70 dark:bg-black/40 shadow-2xl border-white/20 dark:border-white/10 ring-1 ring-white/30 dark:ring-white/10">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Вход в систему</CardTitle>
                <CardDescription className="text-center">
                    Войдите через Email или Имя пользователя
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="login"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email или Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="admin@example.com или admin"
                                            {...field}
                                            className="bg-white/50 dark:bg-black/20"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Пароль</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...field}
                                                className="bg-white/50 dark:bg-black/20 pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">
                                                    {showPassword ? "Скрыть пароль" : "Показать пароль"}
                                                </span>
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Вход...
                                </>
                            ) : (
                                "Войти"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
