"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

export function TelegramSetupButton() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSetup = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/telegram/setup", {
                method: "POST"
            })
            const data = await res.json()

            if (data.success) {
                toast.success("Telegram Webhook успешно настроен!")
                setIsSuccess(true)
                setTimeout(() => setIsSuccess(false), 3000)
            } else {
                throw new Error(data.error || "Ошибка при настройке")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Не удалось настроить бота")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSetup}
            disabled={isLoading}
            className="flex items-center gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccess ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <MessageSquare className="h-4 w-4" />
            )}
            {isLoading ? "Настройка..." : isSuccess ? "Готово" : "Настроить TG Бота"}
        </Button>
    )
}
