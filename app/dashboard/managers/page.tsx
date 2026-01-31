import { createClient } from "@/lib/supabase/server"
import { ManagersClient } from "./client"

async function getData() {
    const supabase = await createClient()

    const [managersRes, dealersRes] = await Promise.all([
        supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                phone,
                role,
                is_active,
                telegram_username,
                created_at,
                tenants:tenant_id (id, name)
            `)
            .eq('role', 'manager')
            .order('created_at', { ascending: false }),

        supabase
            .from('tenants')
            .select('id, name')
            .eq('status', 'active')
            .order('name')
    ])

    if (managersRes.error) {
        console.error('Error fetching managers:', managersRes.error.message)
    }

    if (dealersRes.error) {
        console.error('Error fetching dealers:', dealersRes.error.message)
    }

    return {
        managers: managersRes.data || [],
        dealers: dealersRes.data || []
    }
}

export default async function ManagersPage() {
    const { managers, dealers } = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Менеджеры</h1>
            </div>
            <ManagersClient data={managers} dealers={dealers} />
        </div>
    )
}
