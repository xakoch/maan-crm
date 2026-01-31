import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { getDashboardStats } from "@/lib/stats";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Middleware handles this
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user profile
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    const stats = await getDashboardStats();

    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {/* CalendarDateRangePicker would go here */}
                    <Button>Скачать отчет</Button>
                </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Обзор</TabsTrigger>
                    <TabsTrigger value="analytics" disabled>
                        Аналитика
                    </TabsTrigger>
                    <TabsTrigger value="reports" disabled>
                        Отчеты
                    </TabsTrigger>
                    <TabsTrigger value="notifications" disabled>
                        Уведомления
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Всего Лидов
                                </CardTitle>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_leads}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Новые Лиды
                                </CardTitle>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.new_leads}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Закрытые сделки</CardTitle>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                    <path d="M2 10h20" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.closed_leads}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Конверсия
                                </CardTitle>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="h-4 w-4 text-muted-foreground"
                                >
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Обзор года</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <Overview data={stats.monthly_leads} />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Последние заявки</CardTitle>
                                <CardDescription>
                                    Последние 5 лидов в системе
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RecentSales data={stats.recent_leads} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
