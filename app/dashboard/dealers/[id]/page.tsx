import { createClient } from "@/lib/supabase/server"
import { DealerForm } from "@/components/forms/dealer-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react" // Changed form ArrowLeft to match managers page
import { notFound } from "next/navigation"

interface EditDealerPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditDealerPage({ params }: EditDealerPageProps) {
    const resolvedParams = await params;
    const supabase = await createClient()

    const { data: dealer, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

    if (error || !dealer) {
        notFound()
    }

    const initialData = {
        ...dealer,
        status: dealer.status as "active" | "inactive",
        address: dealer.address || undefined,
        owner_name: dealer.owner_name || "",
        owner_phone: dealer.owner_phone || ""
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/dealers">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Редактирование дилера
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl border rounded-lg p-8">
                <DealerForm initialData={initialData} />
            </div>
        </div>
    )
}
