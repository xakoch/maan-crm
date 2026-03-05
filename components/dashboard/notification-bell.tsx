"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, CheckCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getRecentNotifications, type NotificationItem } from "@/app/actions/notifications"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const STORAGE_KEY = "crm-notifications-last-seen"
const POLL_INTERVAL = 30000
const POPOVER_LIMIT = 5

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    const getLastSeen = useCallback(() => {
        if (typeof window === "undefined") return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        return localStorage.getItem(STORAGE_KEY) || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }, [])

    const fetchNotifications = useCallback(async () => {
        try {
            const lastSeen = getLastSeen()
            const items = await getRecentNotifications(lastSeen)
            setNotifications(items)
            setUnreadCount(items.length)
        } catch (e) {
            console.error("Failed to fetch notifications:", e)
        }
    }, [getLastSeen])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const handleOpen = (open: boolean) => {
        setIsOpen(open)
    }

    const markAllRead = () => {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString())
        setUnreadCount(0)
        setNotifications([])
        setIsOpen(false)
    }

    const viewAll = () => {
        // Mark as read when navigating
        localStorage.setItem(STORAGE_KEY, new Date().toISOString())
        setUnreadCount(0)
        setIsOpen(false)
        router.push("/dashboard/notifications")
    }

    const displayedNotifications = notifications.slice(0, POPOVER_LIMIT)
    const hasMore = notifications.length > POPOVER_LIMIT

    return (
        <Popover open={isOpen} onOpenChange={handleOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Уведомления</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={markAllRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Прочитать все
                        </Button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {displayedNotifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Нет новых уведомлений
                        </div>
                    ) : (
                        displayedNotifications.map((n) => (
                            <div
                                key={n.id}
                                className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push("/dashboard/notifications")
                                }}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="text-sm">
                                        <span className="font-medium">{n.lead_name}</span>
                                        {" → "}
                                        <span className={cn(
                                            "font-medium",
                                            n.new_status === "closed" && "text-green-600",
                                            n.new_status === "rejected" && "text-red-600",
                                            n.new_status === "processing" && "text-yellow-600",
                                        )}>
                                            {n.new_status}
                                        </span>
                                    </div>
                                </div>
                                {n.comment && (
                                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {n.comment}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                    <span>{n.changed_by_name || "Система"}</span>
                                    <span>
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {(displayedNotifications.length > 0 || hasMore) && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={viewAll}
                        >
                            Смотреть все
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
