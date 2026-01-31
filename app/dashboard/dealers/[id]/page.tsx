import { createClient } from "@/lib/supabase/server"
import { DealerForm } from "@/components/forms/dealer-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft, Users, TrendingUp, MapPin, Calendar, Phone, Mail, MessageSquare } from "lucide-react"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface EditDealerPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditDealerPage({ params }: EditDealerPageProps) {
    const resolvedParams = await params;
    const supabase = await createClient()

    // Fetch dealer data
    const { data: dealer, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

    if (error || !dealer) {
        notFound()
    }

    // Fetch managers for this dealer
    const { data: managers } = await supabase
        .from('users')
        .select('id, full_name, email, phone, telegram_username, telegram_id, is_active, created_at')
        .eq('tenant_id', resolvedParams.id)
        .eq('role', 'manager')
        .order('created_at', { ascending: false })

    // Fetch lead statistics for this dealer
    const { data: leads } = await supabase
        .from('leads')
        .select('id, status, created_at, conversion_value')
        .eq('tenant_id', resolvedParams.id)

    // Calculate statistics
    const stats = {
        total: leads?.length || 0,
        new: leads?.filter(l => l.status === 'new').length || 0,
        processing: leads?.filter(l => l.status === 'processing').length || 0,
        closed: leads?.filter(l => l.status === 'closed').length || 0,
        rejected: leads?.filter(l => l.status === 'rejected').length || 0,
        totalValue: leads?.filter(l => l.status === 'closed').reduce((sum, l) => sum + (l.conversion_value || 0), 0) || 0
    }

    const initialData = {
        ...dealer,
        status: dealer.status as "active" | "inactive",
        region: dealer.region || "",
        address: dealer.address || undefined,
        owner_name: dealer.owner_name || "",
        owner_phone: dealer.owner_phone || ""
    }

    // Calculate days working with us
    const daysWithUs = Math.floor((new Date().getTime() - new Date(dealer.created_at).getTime()) / (1000 * 60 * 60 * 24))

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/dealers">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {dealer.name}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" />
                            {dealer.city}{dealer.region ? `, ${dealer.region}` : ''}
                        </p>
                    </div>
                    <Badge variant={dealer.status === 'active' ? 'default' : 'secondary'} className={dealer.status === 'active' ? 'bg-green-500' : ''}>
                        {dealer.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Менеджеры</p>
                            <p className="text-2xl font-bold">{managers?.length || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Закрыто сделок</p>
                            <p className="text-2xl font-bold">{stats.closed}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Сумма всех сделок</p>
                            <p className="text-2xl font-bold">{stats.totalValue.toLocaleString()} сум</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">С нами</p>
                            <p className="text-2xl font-bold">{daysWithUs} дней</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Dealer Form */}
                <div className="lg:col-span-2">
                    <div className="border rounded-lg p-8 shadow-sm h-full">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            Основная информация
                        </h2>
                        <DealerForm initialData={initialData} />
                    </div>
                </div>

                {/* Additional Info Sidebar */}
                <div className="space-y-6">
                    {/* Lead status breakdown */}
                    <div className="border rounded-lg p-6 shadow-sm bg-card">
                        <h3 className="font-semibold mb-4">Статусы лидов</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="text-sm font-medium">Новые заявки</span>
                                <Badge variant="secondary" className="px-2">{stats.new}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="text-sm font-medium">В работе</span>
                                <Badge className="bg-blue-500 hover:bg-blue-600 px-2">{stats.processing}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="text-sm font-medium">Успешно закрыты</span>
                                <Badge className="bg-green-500 hover:bg-green-600 px-2">{stats.closed}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                                <span className="text-sm font-medium">Отклонены</span>
                                <Badge variant="destructive" className="px-2">{stats.rejected}</Badge>
                            </div>
                            <div className="pt-4 border-t mt-4">
                                <div className="flex items-center justify-between text-base font-bold">
                                    <span>Всего лидов</span>
                                    <span>{stats.total}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="border rounded-lg p-6 shadow-sm bg-card">
                        <h3 className="font-semibold mb-4">Контакты владельца</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary mt-[-2px]">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">ФИО Владельца</span>
                                    <p className="font-medium">{dealer.owner_name || "Не указано"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary mt-[-2px]">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Телефон</span>
                                    <p className="font-medium">{dealer.owner_phone || "Не указано"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary mt-[-2px]">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Дата регистрации</span>
                                    <p className="font-medium">{format(new Date(dealer.created_at), "d MMMM yyyy", { locale: ru })}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Managers Table Section */}
            <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
                <div className="p-6 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">Список менеджеров</h3>
                        <Badge variant="outline" className="ml-2">{managers?.length || 0}</Badge>
                    </div>
                    <Link href={`/dashboard/managers/create?tenant_id=${dealer.id}`}>
                        <Button size="sm" className="gap-2">
                            <span>+ Добавить менеджера</span>
                        </Button>
                    </Link>
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Имя сотрудника</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Контакты</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Link ID</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Статус</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {managers && managers.length > 0 ? (
                                managers.map((manager) => (
                                    <tr key={manager.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle">
                                            <div className="font-medium">{manager.full_name}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                {manager.telegram_id ? (
                                                    <span className="text-blue-500 flex items-center gap-0.5 font-medium">
                                                        <MessageSquare className="h-3 w-3" /> TG Connected
                                                    </span>
                                                ) : (
                                                    <span className="text-orange-500 flex items-center gap-0.5">
                                                        Нет Telegram
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {manager.phone}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {manager.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold">
                                                {manager.id.substring(manager.id.length - 6).toUpperCase()}
                                            </code>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={manager.is_active ? 'default' : 'secondary'} className={manager.is_active ? 'bg-green-500 hover:bg-green-600' : ''}>
                                                {manager.is_active ? 'Активен' : 'Неактивен'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Link href={`/dashboard/managers/${manager.id}`}>
                                                <Button size="sm" variant="outline" className="h-8">
                                                    Открыть
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 align-middle text-center text-muted-foreground h-24">
                                        Менеджеры не найдены. Добавьте первого сотрудника.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
