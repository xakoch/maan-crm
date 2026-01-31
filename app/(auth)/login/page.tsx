import LoginForm from "@/components/auth/login-form";
import { Toaster } from "@/components/ui/sonner";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-400/20 blur-[100px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/20 blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Maan CRM
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Панель управления для дилеров и менеджеров
                    </p>
                </div>
                <LoginForm />
            </div>
            <Toaster />
        </div>
    );
}
