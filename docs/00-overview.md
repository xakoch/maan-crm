# CRM для дилерской сети - Обзор проекта

## Бизнес

Франшиза по производству наружной рекламы (вывески, буквы) в Узбекистане.
Ты (франчайзер) запускаешь рекламу → лиды приходят в CRM → автораспределение дилерам → уведомления менеджерам в Telegram.

## Цель Части 1

Запустить базовую CRM с multi-tenant доступом для дилеров и уведомлениями в Telegram.

## Стек

- Next.js 16+ (App Router, TypeScript)
- Supabase (PostgreSQL + Auth + RLS)
- Shadcn UI (ui.shadcn.com)
- React Hook Form + Zod
- Recharts
- node-telegram-bot-api

## Роли

- **super_admin** - ты (видит всё, управляет всеми)
- **dealer** - дилер (видит свой филиал)
- **manager** - менеджер дилера (получает лиды в Telegram)

## Функционал Части 1

1. Публичная форма лида
2. Супер-админ: лиды / дилеры / менеджеры
3. Дилер: dashboard / лиды / менеджеры / профиль
4. Telegram bot (уведомления + inline кнопки)
5. Мобильная адаптация

## .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
