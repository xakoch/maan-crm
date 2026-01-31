import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getWebhookInfo } from "@/lib/telegram/bot";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;

        // Only super_admin can setup bot
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
        if (!appUrl) {
            return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not set" }, { status: 400 });
        }

        const webhookUrl = `${appUrl.startsWith('http') ? appUrl : 'https://' + appUrl}/api/telegram/webhook`;

        await setWebhook(webhookUrl);
        const info = await getWebhookInfo();

        return NextResponse.json({
            success: true,
            url: webhookUrl,
            info
        });
    } catch (error: any) {
        console.error("Telegram setup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const info = await getWebhookInfo();
        return NextResponse.json({ info });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
