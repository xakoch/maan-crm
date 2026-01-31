# Публичная форма лида

## Страница: `/lead-form`

## Дизайн

- Простой лендинг (заголовок + описание услуг)
- Форма по центру
- Мобильная адаптация (главное!)

## Поля формы

1. **Имя** (обязательно)

   - Input text
   - Placeholder: "Ваше имя"
2. **Телефон** (обязательно)

   - Input tel
   - Маска: +998 XX XXX XX XX
   - Валидация: узбекский формат
3. **Город** (обязательно)

   - Select (динамический из БД)
   - Загрузка городов из tenants (уникальные)
4. **Филиал** (условно)

   - Select (показывается если в городе >1 филиала)
   - Загрузка филиалов по city

## Валидация (Zod)

```typescript
const schema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  phone: z.string().regex(/^\+998\d{9}$/, "Неверный формат"),
  city: z.string().min(1, "Выберите город"),
  tenant_id: z.string().uuid().optional()
});
```

## Логика отправки

```typescript
POST /api/leads/create
Body: {
  name,
  phone,
  city,
  region: tenant?.region,
  tenant_id: selectedTenantId,
  source: 'website'
}

Response: { success: true, lead_id: "uuid" }
```

## После отправки

- Редирект на `/thank-you`
- Страница благодарности: "Спасибо! Менеджер свяжется в течение 15 минут"

## Компоненты

- `components/forms/lead-form.tsx`
- Использовать: Button, Input, Select, Label из Shadcn
