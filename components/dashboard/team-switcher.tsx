"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

interface TeamSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: string;
}

export function TeamSwitcher({ className, role }: TeamSwitcherProps) {
    return (
        <div className={cn("flex items-center gap-2 px-2", className)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                M
            </div>
            <span className="font-bold text-lg tracking-tight">Maan CRM</span>
        </div>
    )
}
