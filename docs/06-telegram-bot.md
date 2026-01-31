# Telegram Bot

## Цель

Менеджеры получают уведомления о новых лидах в Telegram с inline кнопками для быстрых действий.

---

## Инициализация бота

### Создание

1. Найти @BotFather в Telegram
2. `/newbot`
3. Дать название
4. Получить токен
5. Добавить в `.env.local`: `TELEGRAM_BOT_TOKEN=...`

### Настройка webhook

```typescript
// lib/telegram/bot.ts
import TelegramBot from 'node-telegram-bot-api';

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: false // используем webhook
});

// Установка webhook (вызвать 1 раз)
export async function setWebhook() {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
  await bot.setWebhook(url);
}
```

---

## Привязка менеджера

### Команда /start

Менеджер:

1. Открывает бот
2. Отправляет `/start`
3. Бот отвечает: "Вы менеджер? Введите свой email из CRM"
4. Менеджер вводит email
5. Бот находит пользователя в БД (email + role=manager)
6. Привязывает `telegram_id` и `telegram_username`
7. Отвечает: "✅ Привязка успешна! Теперь вы будете получать уведомления о лидах."

### Код

```typescript
// app/api/telegram/webhook/route.ts
export async function POST(req: Request) {
  const update = await req.json();
  
  if (update.message?.text === '/start') {
    const chatId = update.message.chat.id;
    const username = update.message.chat.username;
  
    await bot.sendMessage(chatId, 
      'Введите ваш email из CRM для привязки аккаунта:'
    );
  
    // Сохранить состояние ожидания email (можно в памяти или Redis)
    // ...
  }
  
  if (update.message?.text?.includes('@')) {
    // Это email
    const email = update.message.text;
    const chatId = update.message.chat.id;
    const username = update.message.chat.username;
  
    // Найти менеджера в БД
    const { data: manager } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'manager')
      .single();
  
    if (manager) {
      // Привязать
      await supabase
        .from('users')
        .update({
          telegram_id: chatId,
          telegram_username: username
        })
        .eq('id', manager.id);
    
      await bot.sendMessage(chatId, '✅ Привязка успешна!');
    } else {
      await bot.sendMessage(chatId, '❌ Менеджер с таким email не найден');
    }
  }
  
  return Response.json({ ok: true });
}
```

---

## Уведомление о новом лиде

### Триггер

При создании лида (POST /api/leads/create):

1. Сохранить лид в БД
2. Найти менеджера дилера (`assigned_manager_id`)
3. Проверить, есть ли `telegram_id`
4. Отправить уведомление с inline кнопками

### Формат сообщения

```
🔔 Новая заявка!

👤 Имя: Анвар Исламов
📱 Телефон: +998 90 123 45 67
📍 Город: Ташкент, Юнусабад
📊 Источник: Instagram

[Взять в работу] [Отказать]
```

### Код

```typescript
// lib/telegram/notifications.ts
export async function sendLeadNotification(lead: Lead, manager: User) {
  if (!manager.telegram_id) return;
  
  const message = `
🔔 Новая заявка!

👤 Имя: ${lead.name}
📱 Телефон: ${lead.phone}
📍 Город: ${lead.city}${lead.region ? ', ' + lead.region : ''}
📊 Источник: ${lead.source}
  `.trim();
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Взять в работу', callback_data: `accept_${lead.id}` },
        { text: '❌ Отказать', callback_data: `reject_${lead.id}` }
      ]
    ]
  };
  
  await bot.sendMessage(manager.telegram_id, message, {
    reply_markup: keyboard
  });
  
  // Обновить sent_to_telegram
  await supabase
    .from('leads')
    .update({ sent_to_telegram: true })
    .eq('id', lead.id);
}
```

---

## Обработка inline кнопок

### Callback query

```typescript
// app/api/telegram/webhook/route.ts
if (update.callback_query) {
  const callbackData = update.callback_query.data;
  const chatId = update.callback_query.message.chat.id;
  const messageId = update.callback_query.message.message_id;
  
  if (callbackData.startsWith('accept_')) {
    const leadId = callbackData.replace('accept_', '');
  
    // Обновить статус
    await supabase
      .from('leads')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
  
    // Добавить в историю
    await supabase
      .from('lead_history')
      .insert({
        lead_id: leadId,
        changed_by: manager.id,
        old_status: 'new',
        new_status: 'processing',
        comment: 'Взят в работу через Telegram'
      });
  
    // Изменить сообщение
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: messageId
    });
  
    await bot.answerCallbackQuery(update.callback_query.id, {
      text: '✅ Лид взят в работу'
    });
  }
  
  if (callbackData.startsWith('reject_')) {
    // Аналогично, но статус = 'rejected'
    // ...
  }
}
```

---

## Логика назначения менеджера

### Простой вариант (для MVP)

При создании лида:

1. Найти дилера по `tenant_id`
2. Взять первого активного менеджера этого дилера
3. Назначить: `assigned_manager_id`

```typescript
// При создании лида
const { data: managers } = await supabase
  .from('users')
  .select('*')
  .eq('tenant_id', lead.tenant_id)
  .eq('role', 'manager')
  .eq('is_active', true)
  .limit(1);

const assignedManager = managers[0];
```

### В будущем (Часть 2)

Load balancing: распределять равномерно по нагрузке

---

## Файлы

- `lib/telegram/bot.ts` - инициализация
- `lib/telegram/notifications.ts` - отправка уведомлений
- `app/api/telegram/webhook/route.ts` - обработка webhook

---

## Тестирование

1. Создать бот
2. Добавить менеджера в БД
3. Отправить `/start` боту
4. Ввести email менеджера
5. Создать лид через форму
6. Проверить уведомление в Telegram
7. Нажать кнопку "Взять в работу"
8. Проверить в CRM, что статус изменился
