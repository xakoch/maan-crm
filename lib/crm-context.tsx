"use client"

import { createContext, useContext } from "react"

export type CrmType = 'lumara' | 'maan'

interface CrmContextValue {
    crm: CrmType
    basePath: string
}

const CrmContext = createContext<CrmContextValue | null>(null)

export function CrmProvider({ crm, children }: { crm: CrmType; children: React.ReactNode }) {
    return (
        <CrmContext.Provider value={{ crm, basePath: `/${crm}/dashboard` }}>
            {children}
        </CrmContext.Provider>
    )
}

export function useCrm(): CrmContextValue {
    const ctx = useContext(CrmContext)
    if (!ctx) throw new Error("useCrm must be used within CrmProvider")
    return ctx
}
