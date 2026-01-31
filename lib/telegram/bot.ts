// Telegram Bot configuration
// Uses grammy library for Telegram Bot API

import { Bot } from "grammy";

// Bot instance - initialized lazily
let botInstance: Bot | null = null;

export function getBot(): Bot {
    if (!botInstance) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables");
        }
        botInstance = new Bot(token);
    }
    return botInstance;
}

// Send a message to a specific chat
export async function sendMessage(chatId: number | string, text: string, options?: {
    reply_markup?: any;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
}) {
    const bot = getBot();
    return await bot.api.sendMessage(chatId, text, options);
}

// Edit message text
export async function editMessageText(chatId: number | string, messageId: number, text: string) {
    const bot = getBot();
    return await bot.api.editMessageText(chatId, messageId, text);
}

// Remove inline keyboard from message
export async function removeInlineKeyboard(chatId: number | string, messageId: number) {
    const bot = getBot();
    return await bot.api.editMessageReplyMarkup(chatId, messageId, { reply_markup: undefined });
}

// Answer callback query
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    const bot = getBot();
    return await bot.api.answerCallbackQuery(callbackQueryId, { text });
}

// Set webhook URL
export async function setWebhook(url: string) {
    const bot = getBot();
    return await bot.api.setWebhook(url);
}

// Get webhook info
export async function getWebhookInfo() {
    const bot = getBot();
    return await bot.api.getWebhookInfo();
}
