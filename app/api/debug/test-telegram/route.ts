import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { sendMessage } from "@/lib/telegram/bot";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const userId = searchParams.get('userId') || '';

        // Use service role client
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, full_name, telegram_id, telegram_username');

        if (error) {
            return NextResponse.json({ error: "DB error", details: error?.message });
        }

        // Find user by ID suffix
        const user = users?.find(u => u.id.toLowerCase().endsWith(userId.toLowerCase()));

        if (!user) {
            return NextResponse.json({ error: "User not found", searchedFor: userId });
        }

        if (!user.telegram_id) {
            return NextResponse.json({
                error: "User has no telegram_id",
                user: { id: user.id, full_name: user.full_name }
            });
        }

        // Try to send a test message
        try {
            await sendMessage(user.telegram_id, "🔔 Тестовое сообщение из MAAN CRM!\n\nЕсли вы видите это - уведомления работают!");
            return NextResponse.json({
                success: true,
                message: "Test message sent!",
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    telegram_id: user.telegram_id,
                    telegram_username: user.telegram_username
                }
            });
        } catch (sendError: any) {
            return NextResponse.json({
                error: "Failed to send message",
                details: sendError?.message,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    telegram_id: user.telegram_id
                }
            });
        }

    } catch (error: any) {
        return NextResponse.json({ error: "Internal error", details: error?.message });
    }
}
