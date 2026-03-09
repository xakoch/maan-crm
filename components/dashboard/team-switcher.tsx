"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCrm, CrmType } from "@/lib/crm-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronDown } from "lucide-react"

const CRM_CONFIG: Record<CrmType, { label: string; logo: string }> = {
    lumara: { label: "Lumara CRM", logo: "L" },
    maan: { label: "MAAN CRM", logo: "M" },
}

interface TeamSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: string;
}

export function TeamSwitcher({ className, role }: TeamSwitcherProps) {
    const { crm } = useCrm()
    const router = useRouter()
    const config = CRM_CONFIG[crm]
    const isSuperAdmin = role === 'super_admin'

    const logoBlock = (
        <div className={cn("flex items-center gap-2 px-2", className)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                {config.logo}
            </div>
            <span className="font-bold text-lg tracking-tight">{config.label}</span>
            {isSuperAdmin && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
    )

    if (!isSuperAdmin) return logoBlock

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center cursor-pointer hover:opacity-80 outline-none">
                    {logoBlock}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {(['lumara', 'maan'] as CrmType[]).map(c => (
                    <DropdownMenuItem
                        key={c}
                        onClick={() => {
                            if (c !== crm) {
                                router.push(`/${c}/dashboard`)
                            }
                        }}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                                {CRM_CONFIG[c].logo}
                            </div>
                            <span className="font-medium">{CRM_CONFIG[c].label}</span>
                            {c === crm && (
                                <Check className="h-4 w-4 ml-auto text-primary" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
