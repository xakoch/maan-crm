"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export interface LeadTrackingData {
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    utm_content: string | null
    utm_term: string | null
    referrer_url: string | null
    landing_page_url: string | null
    device_type: string | null
    browser: string | null
}

function detectDeviceType(): string {
    if (typeof navigator === "undefined") return "unknown"
    const ua = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet"
    if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return "mobile"
    return "desktop"
}

function detectBrowser(): string {
    if (typeof navigator === "undefined") return "unknown"
    const ua = navigator.userAgent
    if (ua.includes("Firefox")) return "Firefox"
    if (ua.includes("SamsungBrowser")) return "Samsung Browser"
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera"
    if (ua.includes("YaBrowser")) return "Yandex Browser"
    if (ua.includes("Edg")) return "Edge"
    if (ua.includes("Chrome")) return "Chrome"
    if (ua.includes("Safari")) return "Safari"
    return "Other"
}

export function useLeadTracking(): LeadTrackingData {
    const searchParams = useSearchParams()

    return useMemo(() => {
        const utm_source = searchParams.get("utm_source")
        const utm_medium = searchParams.get("utm_medium")
        const utm_campaign = searchParams.get("utm_campaign")
        const utm_content = searchParams.get("utm_content")
        const utm_term = searchParams.get("utm_term")

        const referrer_url = typeof document !== "undefined" && document.referrer
            ? document.referrer
            : null

        const landing_page_url = typeof window !== "undefined"
            ? window.location.href
            : null

        return {
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            utm_term,
            referrer_url,
            landing_page_url,
            device_type: detectDeviceType(),
            browser: detectBrowser(),
        }
    }, [searchParams])
}
