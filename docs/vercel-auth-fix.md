# Решение проблемы Vercel Authentication для Telegram Webhook

## Проблема
Telegram webhook не может достучаться до вашего API, потому что Vercel требует аутентификацию.

Ошибка: `Vercel Authentication` блокирует запросы от Telegram.

## Решение

### Шаг 1: Отключить Vercel Protection

1. Откройте **Vercel Dashboard**: https://vercel.com/dashboard
2. Выберите проект **maan-crm**
3. Перейдите в **Settings** (настройки)
4. Найдите раздел **Deployment Protection** или **Security**
5. Отключите **Vercel Authentication** или **Password Protection**

**ИЛИ** если хотите оставить защиту для остальных страниц:

6. Добавьте исключение (bypass) для пути: `/api/telegram/webhook`

### Шаг 2: После отключения защиты

Сделайте коммит и пуш изменений:

```bash
git add .
git commit -m "fix: allow telegram webhook access"
git push
```

### Шаг 3: Проверка

После деплоя проверьте, что webhook доступен:

```bash
curl -X POST "https://ваш-домен.vercel.app/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"test","chat":{"id":123}}}'
```

Должен вернуться JSON ответ, а не HTML страница аутентификации.

### Шаг 4: Настройка webhook снова

1. Зайдите в админку CRM
2. Нажмите кнопку **"Настроить TG Бота"**
3. Проверьте статус:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Должно быть:
- `pending_update_count`: 0
- Без `last_error_message`

### Шаг 5: Тест

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Бот должен ответить

## Альтернативное решение (если не хотите отключать защиту)

Если вы хотите оставить Vercel Authentication для остального сайта, но разрешить доступ к webhook:

### Вариант A: Использовать отдельный домен для API

Создайте отдельный deployment только для API без защиты.

### Вариант B: Использовать Vercel Edge Config

Настройте Edge Config для обхода аутентификации для конкретных путей.

### Вариант C: Переместить webhook на другой сервис

Используйте Cloudflare Workers или другой serverless сервис для webhook.

## Текущий статус

- ✅ Код исправлен (Service Role Client)
- ✅ Middleware обновлен (пропускает webhook)
- ⚠️ **Vercel Authentication блокирует доступ** ← нужно исправить
- ⏳ После исправления бот заработает

## Важно

После отключения Vercel Authentication убедитесь, что:
1. Ваш production URL защищен другими способами (если нужно)
2. Чувствительные API routes имеют свою аутентификацию
3. Webhook от Telegram валидируется (можно добавить проверку токена)
