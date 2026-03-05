import { createClient } from "@/lib/supabase/server"
import { DeletedLeadsClient } from "./client"

export const dynamic = 'force-dynamic'

async function getData() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'dealer') {
        return []
    }

    const { data, error } = await supabase
        .from('deleted_leads')
        .select('*')
        .order('deleted_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error fetching deleted leads:', error.message)
        return []
    }

    // Fetch deleter names
    const deleterIds = [...new Set(data.map(d => d.deleted_by).filter(Boolean))]
    let usersMap = new Map<string, string>()
    if (deleterIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', deleterIds as string[])
        users?.forEach(u => usersMap.set(u.id, u.full_name))
    }

    return data.map(d => ({
        ...d,
        deleted_by_name: d.deleted_by ? usersMap.get(d.deleted_by) || null : null,
    }))
}

export default async function DeletedLeadsPage() {
    const deletedLeads = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Удалённые лиды</h1>
                <p className="text-muted-foreground mt-1">
                    Архив удалённых заявок с причинами удаления
                </p>
            </div>
            <DeletedLeadsClient data={deletedLeads} />
        </div>
    )
}
