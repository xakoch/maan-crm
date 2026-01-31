"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LeadCreateForm } from "@/components/forms/lead-create-form"

export default function CreateLeadPage() {
    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/leads">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Создать лид вручную</h1>
            </div>
            <div className="max-w-2xl">
                <LeadCreateForm />
            </div>
        </div>
    )
}
