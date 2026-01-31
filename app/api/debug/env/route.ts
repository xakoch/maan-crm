import { NextResponse } from "next/server";

export async function GET() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
        telegram_token_set: !!token,
        telegram_token_preview: token ? `${token.slice(0, 10)}...` : null,
        service_role_key_set: !!serviceKey,
        service_role_key_preview: serviceKey ? `${serviceKey.slice(0, 20)}...` : null,
    });
}
