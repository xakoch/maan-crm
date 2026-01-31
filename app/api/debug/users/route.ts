import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    // Get all users with their IDs
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format for easy viewing
    const formatted = users?.map(u => ({
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        full_id: u.id,
        last_6: u.id.slice(-6),
        last_6_upper: u.id.slice(-6).toUpperCase()
    }));

    return NextResponse.json({ users: formatted }, { status: 200 });
}
