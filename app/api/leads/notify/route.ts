import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { sendLeadNotification } from "@/lib/telegram/notifications";

export async function POST(req: NextRequest) {
    try {
        const { leadId } = await req.json();

        if (!leadId) {
            return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
        }

        // Use service role client for API routes
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get lead details
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            console.error("Lead not found:", leadError);
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        if (lead.sent_to_telegram) {
            return NextResponse.json({ message: "Already sent" });
        }

        let managerToSend = null;

        // 2. Check if manager is already assigned
        if (lead.assigned_manager_id) {
            const { data: manager } = await supabase
                .from('users')
                .select('*')
                .eq('id', lead.assigned_manager_id)
                .single();

            managerToSend = manager;
        } else if (lead.tenant_id) {
            // 3. Find available manager for this tenant
            const { data: managers } = await supabase
                .from('users')
                .select('*')
                .eq('tenant_id', lead.tenant_id)
                .eq('role', 'manager')
                .eq('is_active', true)
                .not('telegram_id', 'is', null) // Only managers with telegram
                .order('created_at'); // FIFO or random?

            if (managers && managers.length > 0) {
                // Pick first one (Round Robin logic could be better but this is MVP)
                managerToSend = managers[0];

                // Auto-assign this manager to the lead
                await supabase
                    .from('leads')
                    .update({ assigned_manager_id: managerToSend.id })
                    .eq('id', leadId);
            }
        }

        if (!managerToSend) {
            console.log("No suitable manager found for lead:", leadId, "tenant:", lead.tenant_id);
            return NextResponse.json({ message: "No suitable manager found to notify" });
        }

        // 4. Send notification
        const sent = await sendLeadNotification(lead, managerToSend, supabase);

        if (sent) {
            return NextResponse.json({ success: true, assignedTo: managerToSend.full_name });
        } else {
            console.warn("Failed to send telegram message for lead:", leadId);
            // Return 200 to avoid client-side errors, since the lead itself is valid/created
            return NextResponse.json({ success: true, warning: "Telegram message not sent" });
        }

    } catch (error) {
        console.error("Error in lead notify:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
