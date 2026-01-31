// Telegram notification functions for leads
import { sendMessage } from "./bot";
import { createClient } from "@/lib/supabase/server";

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
export async function sendLeadNotification(lead: Lead, manager: Manager) {
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
            ],
            [
                { text: "📞 Позвонить", url: `tel:${lead.phone.replace(/\s/g, '')}` }
            ]
        ]
    };

    try {
        await sendMessage(manager.telegram_id, message, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });

        // Update lead to mark as sent to telegram
        const supabase = await createClient();
        await supabase
            .from('leads')
            .update({ sent_to_telegram: true })
            .eq('id', lead.id);

        return true;
    } catch (error) {
        console.error("Error sending lead notification:", error);
        return false;
    }
}

// Helper function to escape markdown special characters
function escapeMarkdown(text: string): string {
    if (!text) return "";
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
