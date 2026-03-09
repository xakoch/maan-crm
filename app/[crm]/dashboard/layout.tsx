import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Database } from "@/types/database.types";
import { MainNav } from "@/components/dashboard/main-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { TeamSwitcher } from "@/components/dashboard/team-switcher";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Suspense } from "react";
import { TopLoader } from "@/components/ui/top-loader";
import { CrmProvider, CrmType } from "@/lib/crm-context";

const VALID_CRMS: CrmType[] = ['lumara', 'maan'];

export default async function CrmDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ crm: string }>;
}) {
    const { crm } = await params;

    // Validate CRM param
    if (!VALID_CRMS.includes(crm as CrmType)) {
        notFound();
    }

    const crmType = crm as CrmType;

    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Handled by middleware mostly
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile with tenant info
    const { data: profile } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();

    const userRole = profile?.role || 'manager';

    // Access control for non-super_admin
    if (userRole !== 'super_admin' && profile?.tenant_id) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('is_maan')
            .eq('id', profile.tenant_id)
            .single();

        const isMaanUser = tenant?.is_maan === true;

        if (crmType === 'maan' && !isMaanUser) {
            redirect('/lumara/dashboard');
        }
        if (crmType === 'lumara' && isMaanUser) {
            redirect('/maan/dashboard');
        }
    }

    return (
        <CrmProvider crm={crmType}>
            <div className="flex-col md:flex">
                <Suspense fallback={null}>
                    <TopLoader />
                </Suspense>
                <div className="border-b">
                    <div className="flex h-16 items-center px-4">
                        <TeamSwitcher role={userRole} />
                        <MainNav className="mx-6" role={userRole} />
                        <div className="ml-auto flex items-center space-x-4">
                            <NotificationBell />
                            <ModeToggle />
                            <UserNav />
                        </div>
                    </div>
                </div>
                <div className="flex-1 space-y-4 p-8 pt-6">
                    {children}
                </div>
            </div>
        </CrmProvider>
    );
}
