import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function resolveUserCrm(supabase: any, userId: string): Promise<'maan' | 'lumara'> {
    const { data: profile } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', userId)
        .single()

    if (!profile) return 'lumara'
    if (profile.role === 'super_admin') return 'lumara' // default for super_admin

    if (profile.tenant_id) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('is_maan')
            .eq('id', profile.tenant_id)
            .single()

        if (tenant?.is_maan) return 'maan'
    }

    return 'lumara'
}

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Check if this is a CRM dashboard route
    const isCrmDashboard = /^\/(maan|lumara)\/dashboard/.test(pathname);

    // Auth protection for both legacy and new CRM dashboard routes
    if ((pathname.startsWith("/dashboard") || isCrmDashboard) && !user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Login redirect for authenticated users
    if (pathname === "/login" && user) {
        const crmPrefix = await resolveUserCrm(supabase, user.id);
        return NextResponse.redirect(new URL(`/${crmPrefix}/dashboard`, request.url));
    }

    // Legacy /dashboard/* redirect to /{crm}/dashboard/*
    if (pathname.startsWith("/dashboard") && user) {
        // Special case: /dashboard/maan/* -> /maan/dashboard/leads
        if (pathname.startsWith("/dashboard/maan")) {
            return NextResponse.redirect(new URL("/maan/dashboard/leads", request.url));
        }

        const crmPrefix = await resolveUserCrm(supabase, user.id);
        const newPath = pathname.replace(/^\/dashboard/, `/${crmPrefix}/dashboard`);
        const url = new URL(newPath, request.url);
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
    }

    return response;
}
