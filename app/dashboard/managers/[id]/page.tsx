
import { ManagerForm } from "@/components/forms/manager-form"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditManagerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: manager } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

    if (!manager) {
        notFound()
    }

    const initialData = {
        ...manager,
        phone: manager.phone || "",
        tenant_id: manager.tenant_id || "",
        telegram_username: manager.telegram_username || undefined,
        is_active: manager.is_active ?? true,
        password: "", // Password is never returned from DB
    }

    // Fetch manager stats
    const { data: leads } = await supabase
        .from('leads')
        .select('status, conversion_value')
        .eq('assigned_manager_id', id)

    const stats = {
        total: leads?.length || 0,
        new: leads?.filter(l => l.status === 'new').length || 0,
        processing: leads?.filter(l => l.status === 'processing').length || 0,
        closed: leads?.filter(l => l.status === 'closed').length || 0,
        rejected: leads?.filter(l => l.status === 'rejected').length || 0,
        totalValue: leads?.filter(l => l.status === 'closed').reduce((sum, l) => sum + (l.conversion_value || 0), 0) || 0
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/managers">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Редактирование менеджера
                    </h1>
                </div>
            </div>

            {/* Small Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Всего лидов</p>
                        <p className="text-2xl font-bold mt-1">{stats.total}</p>
                    </div>
                </div>
                <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">В работе</p>
                        <p className="text-2xl font-bold mt-1 text-blue-500">{stats.processing}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Новых: <span className="text-foreground font-medium">{stats.new}</span></p>
                </div>
                <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Закрыто</p>
                        <p className="text-2xl font-bold mt-1 text-green-500">{stats.closed}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Отклонено: <span className="text-foreground font-medium">{stats.rejected}</span></p>
                </div>
                <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Сумма сделок</p>
                        <p className="text-2xl font-bold mt-1 text-indigo-500">{stats.totalValue.toLocaleString()} сум</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl border rounded-lg p-8">
                <ManagerForm initialData={initialData} />
            </div>
        </div>
    )
}
