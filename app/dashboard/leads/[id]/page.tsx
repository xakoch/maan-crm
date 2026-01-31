import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/types/database.types"
import { LeadEditForm } from "@/components/forms/lead-edit-form"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface LeadPageProps {
    params: Promise<{
        id: string
    }>
}

async function getLead(id: string) {
    const cookieStore = await cookies()
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
    )

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }

    return data
}

async function getLeadHistory(leadId: string) {
    const cookieStore = await cookies()
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
    )

    const { data, error } = await supabase
        .from('lead_history')
        .select(`
            *,
            users (full_name)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching history:', error)
        return []
    }

    return data
}

export default async function LeadPage({ params }: LeadPageProps) {
    const resolvedParams = await params;
    const [lead, history] = await Promise.all([
        getLead(resolvedParams.id),
        getLeadHistory(resolvedParams.id)
    ])

    if (!lead) {
        notFound()
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/leads">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Редактирование Лида</h1>
            </div>
            <LeadEditForm lead={lead} history={history} />
        </div>
    )
}
