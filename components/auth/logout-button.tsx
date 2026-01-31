"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Выход
        </Button>
    );
}
