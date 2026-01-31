"use client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UserNav() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string>("");
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        async function getUser() {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || "");

                // Fetch profile for name
                const { data: profile } = await supabase
                    .from("users")
                    .select("full_name")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setUserName(profile.full_name);
                }
            }
        }
        getUser();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt="@admin" />
                        <AvatarFallback>{userName.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        Профиль
                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Настройки
                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    Выход
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
