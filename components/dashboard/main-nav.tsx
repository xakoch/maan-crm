"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { LayoutDashboard, Users, UserCog, Building2, Settings } from "lucide-react";

const mainNav = [
    {
        title: "Дашборд",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Лиды",
        href: "/dashboard/leads",
        icon: Users,
    },
    {
        title: "Дилеры",
        href: "/dashboard/dealers",
        icon: Building2,
    },
    {
        title: "Менеджеры",
        href: "/dashboard/managers",
        icon: UserCog,
    },
    {
        title: "Настройки",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

interface MainNavProps extends React.HTMLAttributes<HTMLElement> { }

export function MainNav({ className, ...props }: MainNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            {mainNav.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md mr-[10px] last:mr-0",
                        pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                            ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                            : "text-muted-foreground"
                    )}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}
