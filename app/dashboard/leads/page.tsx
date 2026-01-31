import { createClient } from "@/lib/supabase/server"
import { LeadsClient } from "./client"

async function getData() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            tenants:tenant_id (name),
            managers:assigned_manager_id (full_name)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching leads:', error.message)
        return []
    }

    return data
}

export default async function LeadsPage() {
    const data = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Заявки (Лиды)</h1>
            </div>
            <LeadsClient data={data} />
        </div>
    )
}
