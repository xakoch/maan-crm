"use client"

import { Button } from "@/components/ui/button"
import { ManagerForm } from "@/components/forms/manager-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function CreateManagerPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/managers">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Добавить менеджера</h1>
            </div>

            <div className="max-w-4xl border rounded-lg p-8">
                <ManagerForm />
            </div>
        </div>
    )
}
