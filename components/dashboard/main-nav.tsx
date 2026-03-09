"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCrm, CrmType } from "@/lib/crm-context";

import { LayoutDashboard, Users, UserCog, Building2, Settings, BarChart3, UserCheck, Building } from "lucide-react";

const navItems = [
    {
        title: "Дашборд",
        path: "",
        icon: LayoutDashboard,
    },
    {
        title: "Аналитика",
        path: "/analytics",
        icon: BarChart3,
    },
    {
        title: "Лиды",
        path: "/leads",
        icon: Users,
    },
    {
        title: "Клиенты",
        path: "/clients",
        icon: UserCheck,
    },
    {
        title: "Компании",
        path: "/companies",
        icon: Building,
    },
    {
        title: "Дилеры",
        path: "/dealers",
        icon: Building2,
        crmOnly: 'lumara' as CrmType,
    },
    {
        title: "Менеджеры",
        path: "/managers",
        icon: UserCog,
    },
    {
        title: "Настройки",
        path: "/settings",
        icon: Settings,
    },
];

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
    role?: string;
}

export function MainNav({ className, role = 'manager', ...props }: MainNavProps) {
    const pathname = usePathname();
    const { crm, basePath } = useCrm();

    // Filter items based on role and CRM
    const filteredNav = navItems.filter(item => {
        // CRM-specific items (e.g., Dealers only for Lumara)
        if (item.crmOnly && item.crmOnly !== crm) {
            return false;
        }
        // Settings only for super_admin
        if (item.path === '/settings' && role !== 'super_admin') {
            return false;
        }
        // Managers see Dashboard, Analytics, Leads, and Clients
        if (role === 'manager') {
            return ['', '/analytics', '/leads', '/clients'].includes(item.path);
        }
        // Others see everything (except CRM-filtered above)
        return true;
    });

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            {filteredNav.map((item) => {
                const href = basePath + item.path;
                const isActive = item.path === ''
                    ? pathname === basePath
                    : pathname.startsWith(href);

                return (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex items-center text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md mr-[10px] last:mr-0",
                            isActive
                                ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
}
