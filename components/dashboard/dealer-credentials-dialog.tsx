"use client"

import { useState } from "react"
import { Copy, Key, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Dealer {
    id: string
    name: string
    owner_name: string | null
    owner_phone: string | null
}

interface DealerCredentialsDialogProps {
    dealer: Dealer | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DealerCredentialsDialog({ dealer, open, onOpenChange }: DealerCredentialsDialogProps) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper to generate credentials
    const generate = () => {
        if (!dealer) return

        // Transliterate name for username
        const translit = (str: string) => {
            const ru: Record<string, string> = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
                'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
                'э': 'e', 'ю': 'yu', 'я': 'ya'
            }
            return str.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9]/g, '')
        }

        const usernameBase = translit(dealer.name).slice(0, 10)
        const newUsername = `${usernameBase}_admin`

        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let newPassword = ""
        for (let i = 0; i < 10; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        setUsername(newUsername)
        setPassword(newPassword)
    }

    const onSubmit = async () => {
        if (!dealer || !username || !password) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/dealers/reset-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: dealer.id,
                    username,
                    password,
                    owner_name: dealer.owner_name || "Admin",
                    owner_phone: dealer.owner_phone
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Ошибка при обновлении доступа")
            }

            toast.success("Доступ обновлен")
            // Don't close immediately, let user copy
        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} скопирован`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Управление доступом
                    </DialogTitle>
                    <DialogDescription>
                        Сгенерируйте новые данные для входа для дилера <b>{dealer?.name}</b>.
                        <br />
                        <span className="text-yellow-600 dark:text-yellow-500 text-xs">
                            Внимание: Старый пароль перестанет действовать.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={generate} className="text-xs h-8">
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Сгенерировать новые
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Логин</Label>
                        <div className="flex gap-2">
                            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(username, "Логин")} disabled={!username}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Пароль</Label>
                        <div className="flex gap-2">
                            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" />
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(password, "Пароль")} disabled={!password}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Закрыть
                    </Button>
                    <Button type="button" onClick={onSubmit} disabled={isSubmitting || !username || !password}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Сохранить и применить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
