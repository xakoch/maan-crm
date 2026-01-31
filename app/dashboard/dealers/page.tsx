import { createClient } from "@/lib/supabase/server"
import { DealersTable } from "@/components/dashboard/dealers-table"

async function getDealers() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching dealers:', error.message)
        return []
    }

    return data
}

export default async function DealersPage() {
    const data = await getDealers()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Дилеры</h1>
            </div>
            <DealersTable data={data} />
        </div>
    )
}
