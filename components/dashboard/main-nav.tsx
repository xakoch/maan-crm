"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { LayoutDashboard, Users, UserCog, Building2, Settings, BarChart3, Crown, UserCheck, Building } from "lucide-react";

const mainNav = [
    {
        title: "Дашборд",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Аналитика",
        href: "/dashboard/analytics",
        icon: BarChart3,
    },
    {
        title: "Лиды",
        href: "/dashboard/leads",
        icon: Users,
    },
    {
        title: "Клиенты",
        href: "/dashboard/clients",
        icon: UserCheck,
    },
    {
        title: "Компании",
        href: "/dashboard/companies",
        icon: Building,
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
        title: "MAAN",
        href: "/dashboard/maan",
        icon: Crown,
    },
    {
        title: "Настройки",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
    role?: string;
}

export function MainNav({ className, role = 'manager', ...props }: MainNavProps) {
    const pathname = usePathname();

    // Filter items based on role
    const filteredNav = mainNav.filter(item => {
        // MAAN and Settings only for super_admin
        if ((item.href === '/dashboard/maan' || item.href === '/dashboard/settings') && role !== 'super_admin') {
            return false;
        }
        // Managers see Dashboard, Analytics, Leads, and Clients
        if (role === 'manager') {
            return ['/dashboard', '/dashboard/analytics', '/dashboard/leads', '/dashboard/clients'].includes(item.href);
        }
        // Others see everything (except MAAN filtered above)
        return true;
    });

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            {filteredNav.map((item) => (
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
