"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DealerForm } from "@/components/forms/dealer-form"

export default function CreateDealerPage() {
    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/dealers">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Добавить дилера</h1>
            </div>
            <div className="max-w-2xl">
                <DealerForm />
            </div>
        </div>
    )
}
