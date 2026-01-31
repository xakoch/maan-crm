import { NextRequest, NextResponse } from "next/server";
import { sendMessage, answerCallbackQuery, removeInlineKeyboard } from "@/lib/telegram/bot";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// Store pending verifications in memory
const pendingVerifications = new Map<number, { step: 'awaiting_id' }>();

export async function POST(req: NextRequest) {
    try {
        const update = await req.json();

        // Use service role client for webhook (no user session)
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Handle /start command
        if (update.message?.text === '/start') {
            const chatId = update.message.chat.id;

            // Check if already linked
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('telegram_id', chatId)
                .single();

            if (existingUser) {
                await sendMessage(chatId,
                    `✅ Вы уже привязаны как *${existingUser.full_name}*!\\n\\nВы будете получать уведомления о новых лидах.`,
                    { parse_mode: "Markdown" }
                );
                return NextResponse.json({ ok: true });
            }

            // Set pending state
            pendingVerifications.set(chatId, { step: 'awaiting_id' });

            await sendMessage(chatId,
                `👋 Добро пожаловать в *MAAN CRM Bot*!\\n\\nОтправьте ваш *Link ID* (последние 6 символов), чтобы привязать аккаунт.`,
                { parse_mode: "Markdown" }
            );

            return NextResponse.json({ ok: true });
        }

        // Handle /status command
        if (update.message?.text === '/status') {
            const chatId = update.message.chat.id;

            const { data: user } = await supabase
                .from('users')
                .select('id, full_name, email, tenants:tenant_id(name)')
                .eq('telegram_id', chatId)
                .single();

            if (user) {
                const tenantName = (user.tenants as any)?.name || 'Не назначен';
                await sendMessage(chatId,
                    `📊 *Ваш статус*\\n\\n` +
                    `👤 *Имя:* ${user.full_name}\\n` +
                    `🏢 *Дилер:* ${tenantName}\\n\\n` +
                    `✅ Привязка активна`,
                    { parse_mode: "Markdown" }
                );
            } else {
                await sendMessage(chatId,
                    `❌ Вы не привязаны к CRM.\\n\\nОтправьте /start для начала привязки.`,
                    { parse_mode: "Markdown" }
                );
            }

            return NextResponse.json({ ok: true });
        }

        // Handle text message (Link ID)
        if (update.message?.text && !update.message.text.startsWith('/')) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();
            const username = update.message.from?.username;

            const pending = pendingVerifications.get(chatId);
            if (!pending || pending.step !== 'awaiting_id') {
                return NextResponse.json({ ok: true });
            }

            // --- USER SEARCH LOGIC START ---

            // 1. Fetch ALL users
            const { data: allUsers, error } = await supabase
                .from('users')
                .select('id, full_name, email, role');

            if (error) {
                await sendMessage(chatId, `❌ Ошибка доступа к БД: ${error.message}`);
                return NextResponse.json({ ok: true });
            }

            const cleanText = text.toLowerCase();

            // 2. Try strict suffix match
            let manager = allUsers?.find(u => u.id.toLowerCase().endsWith(cleanText));

            // 3. If not found, try relaxed substring match (if text is long enough)
            if (!manager && cleanText.length >= 4) {
                manager = allUsers?.find(u => u.id.toLowerCase().includes(cleanText));
            }

            if (!manager) {
                // Generate a helpful list of valid codes
                const userList = allUsers?.map(u =>
                    `👤 ${u.full_name}: \`${u.id.slice(-6)}\``
                ).join('\n');

                const debugMsg = `🔍 **Отладка**\n` +
                    `Я получил: \`${cleanText}\`\n` +
                    `Пользователей в базе: ${allUsers?.length || 0}\n\n` +
                    `**Попробуйте скопировать один из кодов ниже:**\n${userList || 'Нет пользователей 🤔'}`;

                await sendMessage(chatId, debugMsg, { parse_mode: "Markdown" });

                await sendMessage(chatId,
                    `❌ Совпадений не найдено.\nЕсли вы видите себя в списке выше, отправьте соответствующий код.`,
                    { parse_mode: "Markdown" }
                );
                return NextResponse.json({ ok: true });
            }
            // --- USER SEARCH LOGIC END ---

            // Link the account
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    telegram_id: chatId,
                    telegram_username: username || null
                })
                .eq('id', manager.id);

            if (updateError) {
                await sendMessage(chatId, `❌ Ошибка при сохранении привязки в БД.`);
                return NextResponse.json({ ok: true });
            }

            pendingVerifications.delete(chatId);

            await sendMessage(chatId,
                `✅ *Привязка успешна!*\\n\\n` +
                `👤 Имя: *${manager.full_name}*\\n` +
                `Теперь вы будете получать уведомления о новых лидах! 🔔`,
                { parse_mode: "Markdown" }
            );

            return NextResponse.json({ ok: true });
        }

        // Handle callback queries
        if (update.callback_query) {
            const callbackData = update.callback_query.data;
            const chatId = update.callback_query.message.chat.id;
            const messageId = update.callback_query.message.message_id;
            const callbackId = update.callback_query.id;

            const { data: manager } = await supabase
                .from('users')
                .select('id')
                .eq('telegram_id', chatId)
                .single();

            if (!manager) {
                await answerCallbackQuery(callbackId, "❌ Вы не привязаны к CRM");
                return NextResponse.json({ ok: true });
            }

            if (callbackData.startsWith('accept_')) {
                const leadId = callbackData.replace('accept_', '');
                const { data: lead } = await supabase.from('leads').select('status').eq('id', leadId).single();

                if (lead) {
                    await supabase.from('leads').update({
                        status: 'processing',
                        assigned_manager_id: manager.id,
                        updated_at: new Date().toISOString()
                    }).eq('id', leadId);

                    await supabase.from('lead_history').insert({
                        lead_id: leadId,
                        changed_by: manager.id,
                        old_status: lead.status,
                        new_status: 'processing',
                        comment: 'Взят в работу через TG'
                    });

                    await removeInlineKeyboard(chatId, messageId);
                    await answerCallbackQuery(callbackId, "✅ Лид взят в работу");
                }
            }

            if (callbackData.startsWith('reject_')) {
                const leadId = callbackData.replace('reject_', '');
                const { data: lead } = await supabase.from('leads').select('status').eq('id', leadId).single();

                if (lead) {
                    await supabase.from('leads').update({
                        status: 'rejected',
                        assigned_manager_id: manager.id,
                        rejection_reason: 'Отклонено через TG',
                        updated_at: new Date().toISOString()
                    }).eq('id', leadId);

                    await supabase.from('lead_history').insert({
                        lead_id: leadId,
                        changed_by: manager.id,
                        old_status: lead.status,
                        new_status: 'rejected',
                        comment: 'Отклонено через TG'
                    });

                    await removeInlineKeyboard(chatId, messageId);
                    await answerCallbackQuery(callbackId, "❌ Лид отклонен");
                }
            }

            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Telegram webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: "ok" });
}
