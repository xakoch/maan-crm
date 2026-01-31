"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface UserDebug {
    full_name: string
    email: string
    role: string
    full_id: string
    last_6: string
    last_6_upper: string
}

export default function DebugUsersPage() {
    const [users, setUsers] = useState<UserDebug[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/debug/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data.users || [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        toast.success(`Скопировано: ${text}`)
        setTimeout(() => setCopied(null), 2000)
    }

    if (loading) {
        return <div className="p-8">Загрузка...</div>
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Debug: User IDs</h1>
            <p className="text-muted-foreground mb-6">
                Последние 6 символов ID для привязки Telegram
            </p>

            <div className="grid gap-4">
                {users.map((user) => (
                    <Card key={user.full_id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{user.full_name}</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {user.role}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Email:</span>{" "}
                                {user.email}
                            </div>
                            <div className="text-sm">
                                <span className="text-muted-foreground">Full ID:</span>{" "}
                                <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {user.full_id}
                                </code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Link ID (последние 6):
                                </span>
                                <code className="bg-primary/10 px-3 py-1 rounded font-mono text-lg font-bold">
                                    {user.last_6}
                                </code>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(user.last_6, user.full_id)}
                                >
                                    {copied === user.full_id ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Link ID (UPPERCASE):
                                </span>
                                <code className="bg-primary/10 px-3 py-1 rounded font-mono text-lg font-bold">
                                    {user.last_6_upper}
                                </code>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(user.last_6_upper, user.full_id + '-upper')}
                                >
                                    {copied === user.full_id + '-upper' ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
