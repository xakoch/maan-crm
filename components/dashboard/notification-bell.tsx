"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
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

const STATUS_LABELS: Record<string, string> = {
    new: "Новый",
    processing: "В работе",
    closed: "Закрыт",
    rejected: "Отклонён",
}

const STORAGE_KEY = "crm-notifications-last-seen"
const POLL_INTERVAL = 30000

export function NotificationBell() {
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
        if (open) {
            // Mark as read
            localStorage.setItem(STORAGE_KEY, new Date().toISOString())
            setUnreadCount(0)
        }
    }

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
                <div className="p-3 border-b">
                    <h4 className="font-semibold text-sm">Уведомления</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Нет новых уведомлений
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
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
                                            {STATUS_LABELS[n.new_status] || n.new_status}
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
            </PopoverContent>
        </Popover>
    )
}
