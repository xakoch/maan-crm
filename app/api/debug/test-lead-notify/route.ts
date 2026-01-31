import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { sendMessage } from "@/lib/telegram/bot";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId') || '';

    try {
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return NextResponse.json({ error: "Lead not found", leadId });
        }

        // 2. Get manager
        let manager = null;
        if (lead.assigned_manager_id) {
            const { data: m } = await supabase
                .from('users')
                .select('*')
                .eq('id', lead.assigned_manager_id)
                .single();
            manager = m;
        }

        if (!manager) {
            return NextResponse.json({
                error: "Manager not found",
                lead: {
                    id: lead.id,
                    name: lead.name,
                    assigned_manager_id: lead.assigned_manager_id,
                    sent_to_telegram: lead.sent_to_telegram
                }
            });
        }

        // 3. Check telegram_id
        if (!manager.telegram_id) {
            return NextResponse.json({
                error: "Manager has no telegram_id",
                manager: {
                    id: manager.id,
                    full_name: manager.full_name,
                    telegram_id: manager.telegram_id
                }
            });
        }

        // 4. Try to send message
        const message = `🔔 *Тест уведомления*\n\nЛид: ${lead.name}\nТелефон: ${lead.phone}`;

        try {
            await sendMessage(manager.telegram_id, message, { parse_mode: "Markdown" });

            return NextResponse.json({
                success: true,
                lead: { id: lead.id, name: lead.name },
                manager: {
                    id: manager.id,
                    full_name: manager.full_name,
                    telegram_id: manager.telegram_id,
                    telegram_id_type: typeof manager.telegram_id
                }
            });
        } catch (sendError: any) {
            return NextResponse.json({
                error: "Failed to send message",
                errorDetails: sendError?.message,
                manager: {
                    telegram_id: manager.telegram_id,
                    telegram_id_type: typeof manager.telegram_id
                }
            });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error?.message });
    }
}
