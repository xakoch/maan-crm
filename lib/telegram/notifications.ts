// Telegram notification functions for leads
import { sendMessage } from "./bot";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

interface Lead {
    id: string;
    name: string;
    phone: string;
    city: string;
    region?: string | null;
    source: string;
}

interface Manager {
    id: string;
    telegram_id: number | null;
    full_name: string;
}

// Send notification about new lead to manager
export async function sendLeadNotification(
    lead: Lead,
    manager: Manager,
    supabase: SupabaseClient<Database>
): Promise<boolean | any> {
    if (!manager.telegram_id) {
        console.log(`Manager ${manager.id} has no telegram_id, skipping notification`);
        return false;
    }

    const sourceLabels: Record<string, string> = {
        website: "🌐 Сайт",
        instagram: "📸 Instagram",
        facebook: "📘 Facebook",
        manual: "✍️ Ручной ввод",
        other: "📋 Другое"
    };

    const message = `
🔔 *Новая заявка!*

👤 *Имя:* ${escapeMarkdown(lead.name)}
📱 *Телефон:* ${escapeMarkdown(lead.phone)}
📍 *Город:* ${escapeMarkdown(lead.city)}${lead.region ? ', ' + escapeMarkdown(lead.region) : ''}
📊 *Источник:* ${sourceLabels[lead.source] || lead.source}
`.trim();

    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Взять в работу", callback_data: `accept_${lead.id}` },
                { text: "❌ Отказать", callback_data: `reject_${lead.id}` }
            ]
        ]
    };

    try {
        await sendMessage(manager.telegram_id, message, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });

        // Update lead to mark as sent to telegram
        await supabase
            .from('leads')
            .update({ sent_to_telegram: true })
            .eq('id', lead.id);

        return true;
    } catch (error: any) {
        console.error("Error sending lead notification:", error);
        return { message: error?.message, stack: error?.stack };
    }
}

// Helper function to escape markdown special characters
// Only escape characters that break Markdown parsing
function escapeMarkdown(text: string): string {
    if (!text) return "";
    // Only escape: _ * [ ] ( ) ~ ` > #
    return text.replace(/[_*[\]()~`>#]/g, '\\$&');
}

// Send notification about new lead to a specific group chat
export async function sendGroupLeadNotification(
    lead: Lead,
    groupChatId: string
): Promise<boolean | any> {
    const sourceLabels: Record<string, string> = {
        website: "🌐 Сайт",
        instagram: "📸 Instagram",
        facebook: "📘 Facebook",
        manual: "✍️ Ручной ввод",
        other: "📋 Другое"
    };

    const message = `
🔔 *Новая заявка!*

👤 *Имя:* ${escapeMarkdown(lead.name)}
📱 *Телефон:* ${escapeMarkdown(lead.phone)}
📍 *Регион:* ${escapeMarkdown(lead.city || lead.region || 'Не указан')}
`.trim();

    // Note: Inline keyboards might not be suitable for group chats if the action is specific to a user, 
    // but a "View Lead" button could work. For now, simple text message.

    try {
        await sendMessage(groupChatId, message, {
            parse_mode: "Markdown"
        });

        return true;
    } catch (error: any) {
        console.error("Error sending group lead notification:", error);
        return { message: error?.message, stack: error?.stack };
    }
}
