"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const mainNav = [
    {
        title: "Обзор",
        href: "/dashboard",
    },
    {
        title: "Лиды",
        href: "/dashboard/leads",
    },
    {
        title: "Дилеры",
        href: "/dashboard/dealers",
    },
    {
        title: "Менеджеры",
        href: "/dashboard/managers",
    },
    {
        title: "Настройки",
        href: "/dashboard/settings",
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
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === item.href
                            ? "text-primary"
                            : "text-muted-foreground"
                    )}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}
