'use server'

import { createClient } from "@/lib/supabase/server"

export interface DuplicateLeadInfo {
    id: string
    name: string
    phone: string
    status: string
    created_at: string
    source: string | null
}

export async function checkDuplicatePhone(phone: string): Promise<DuplicateLeadInfo | null> {
    const digits = phone.replace(/\D/g, "")
    const last9 = digits.slice(-9)

    if (last9.length < 9) return null

    const supabase = await createClient()

    // Search for leads where phone contains the last 9 digits
    const { data } = await supabase
        .from('leads')
        .select('id, name, phone, status, created_at, source')
        .ilike('phone', `%${last9.slice(0, 3)}%${last9.slice(3, 6)}%${last9.slice(6, 9)}%`)
        .order('created_at', { ascending: false })
        .limit(10)

    if (!data || data.length === 0) return null

    // More precise match: compare last 9 digits
    const match = data.find(lead => {
        const leadDigits = lead.phone.replace(/\D/g, "")
        return leadDigits.slice(-9) === last9
    })

    return match || null
}
