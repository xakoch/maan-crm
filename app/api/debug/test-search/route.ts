import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const linkId = searchParams.get('id') || 'A8226A';

    // Use service role client (same as webhook)
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all users
    const { data: allUsers, error } = await supabase
        .from('users')
        .select('id, full_name, email');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const searchText = linkId.toLowerCase();

    // Try to find
    const manager = allUsers?.find(u => u.id.toLowerCase().endsWith(searchText));

    return NextResponse.json({
        searchText,
        totalUsers: allUsers?.length,
        foundManager: manager || null,
        allUserIds: allUsers?.map(u => ({
            name: u.full_name,
            id: u.id,
            last6: u.id.slice(-6),
            endsWithSearch: u.id.toLowerCase().endsWith(searchText)
        }))
    });
}
