
import { ManagerForm } from "@/components/forms/manager-form"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditManagerPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: manager } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
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

            <div className="max-w-4xl border rounded-lg p-8">
                <ManagerForm initialData={initialData} />
            </div>
        </div>
    )
}
