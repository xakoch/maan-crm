"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function TopLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const prevPathRef = useRef(pathname)

    useEffect(() => {
        // Route changed — finish loading
        if (prevPathRef.current !== pathname) {
            setProgress(100)
            setTimeout(() => {
                setLoading(false)
                setProgress(0)
            }, 300)
            prevPathRef.current = pathname
        }
    }, [pathname, searchParams])

    useEffect(() => {
        // Intercept link clicks to detect navigation start
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest("a")
            if (!anchor) return

            const href = anchor.getAttribute("href")
            if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return

            // Same page — skip
            if (href === pathname) return

            // Start loading
            setLoading(true)
            setProgress(20)

            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        if (timerRef.current) clearInterval(timerRef.current)
                        return 90
                    }
                    return prev + Math.random() * 10
                })
            }, 300)
        }

        document.addEventListener("click", handleClick)
        return () => {
            document.removeEventListener("click", handleClick)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [pathname])

    if (!loading) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
            <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
