"use client"

import { useState, useEffect } from "react"
import { getAllNotifications, type NotificationItem } from "@/app/actions/notifications"
import { formatDistanceToNow, format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, Bell, Clock, User, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

export function NotificationsClient() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const result = await getAllNotifications(0, 30)
                setNotifications(result.items)
                setHasMore(result.hasMore)
            } catch (e) {
                console.error("Failed to load notifications:", e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const loadMore = async () => {
        setLoadingMore(true)
        try {
            const nextPage = page + 1
            const result = await getAllNotifications(nextPage, 30)
            setNotifications(prev => [...prev, ...result.items])
            setHasMore(result.hasMore)
            setPage(nextPage)
        } catch (e) {
            console.error("Failed to load more:", e)
        } finally {
            setLoadingMore(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg">Нет уведомлений</p>
                <p className="text-sm mt-1">Здесь будут отображаться изменения по заявкам</p>
            </div>
        )
    }

    // Group by date
    const grouped = new Map<string, NotificationItem[]>()
    notifications.forEach(n => {
        const dateKey = format(new Date(n.created_at), 'd MMMM yyyy', { locale: ru })
        if (!grouped.has(dateKey)) grouped.set(dateKey, [])
        grouped.get(dateKey)!.push(n)
    })

    return (
        <div className="space-y-6">
            {Array.from(grouped.entries()).map(([date, items]) => (
                <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                        {date}
                    </h3>
                    <div className="space-y-2">
                        {items.map(n => (
                            <Card
                                key={n.id}
                                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => router.push(`/dashboard/leads`)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            n.new_status === "closed" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
                                            n.new_status === "rejected" && "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
                                            n.new_status === "processing" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
                                            n.new_status === "new" && "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                                            !["closed", "rejected", "processing", "new"].includes(n.new_status) && "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
                                        )}>
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{n.lead_name}</span>
                                            {n.old_status && (
                                                <>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                                        {n.old_status}
                                                    </Badge>
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                </>
                                            )}
                                            <Badge
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0 h-4",
                                                    n.new_status === "closed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20",
                                                    n.new_status === "rejected" && "bg-rose-100 text-rose-700 dark:bg-rose-500/20",
                                                    n.new_status === "processing" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20",
                                                    n.new_status === "new" && "bg-blue-100 text-blue-700 dark:bg-blue-500/20",
                                                )}
                                            >
                                                {n.new_status}
                                            </Badge>
                                        </div>
                                        {n.comment && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                                <MessageSquare className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{n.comment}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {n.changed_by_name || "Система"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Загрузить ещё
                    </Button>
                </div>
            )}
        </div>
    )
}
