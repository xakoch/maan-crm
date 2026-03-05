import { NotificationsClient } from "./client"

export const dynamic = 'force-dynamic'

export default function NotificationsPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Уведомления</h1>
                <p className="text-muted-foreground mt-1">
                    Все изменения по вашим заявкам
                </p>
            </div>
            <NotificationsClient />
        </div>
    )
}
