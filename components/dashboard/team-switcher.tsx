"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

export function TeamSwitcher({ className }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center gap-2 px-2", className)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                M
            </div>
            <span className="font-bold text-lg tracking-tight">Maan CRM</span>
        </div>
    )
}
