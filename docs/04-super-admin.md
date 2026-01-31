# Супер-админ панель

## Доступ

Роль: `super_admin`
Базовый путь: `/dashboard`

---

## 1. Dashboard `/dashboard`

### Карточки статистики

```typescript
// GET /api/stats?period=30
{
  total_leads: 156,
  closed_leads: 89,
  conversion_rate: 57.05, // %
  total_revenue: 450000000 // сум
}
```

Компонент: `StatsCards`

- 4 карточки в ряд (на мобиле - столбцом)
- Иконки, числа, описание

### График лидов

- Линейный график (Recharts)
- Последние 30 дней
- Ось X: даты, Ось Y: кол-во лидов

### Топ-3 дилера

Таблица:

- Название
- Город
- Конверсия (%)
- Кол-во сделок

---

## 2. Лиды `/dashboard/leads`

### Таблица

Колонки:

- ID (короткий, первые 8 символов)
- Имя
- Телефон
- Город
- Дилер
- Менеджер
- Статус (badge)
- Источник
- Дата создания
- Действия (кнопки)

### Фильтры

- Статус (all/new/processing/closed/rejected)
- Дилер (select)
- Источник (select)
- Дата (диапазон)

### Поиск

- По имени или телефону

### Кнопка "Добавить лид"

- Ведет на `/dashboard/leads/create`

### Пагинация

- 20 на страницу

### Действия

- Просмотр: `/dashboard/leads/[id]`
- Редактировать статус (модалка)
- Переназначить менеджера (модалка)

---

## 3. Добавить лид `/dashboard/leads/create`

### Форма

```typescript
{
  name: string,
  phone: string,
  city: string,
  region?: string,
  tenant_id: uuid,
  assigned_manager_id?: uuid,
  source: select (website/instagram/facebook/manual/other),
  status?: select (по умолчанию 'new')
}
```

### Логика

1. Выбор города → показать филиалы
2. Выбор филиала → показать менеджеров этого филиала
3. Источник - обязательно
4. После создания → редирект на `/dashboard/leads`

---

## 4. Детали лида `/dashboard/leads/[id]`

### Информация

- Основные данные (имя, телефон, город, дилер, менеджер)
- Статус (можно изменить)
- Источник
- Даты (создан, обновлен, закрыт)
- Сумма сделки (если закрыт)
- Причина отказа (если rejected)

### История изменений

Timeline из `lead_history`:

```
[17:45] Лид создан (система)
[17:46] Назначен менеджеру Иван (Админ)
[18:00] Статус: В работе (Иван)
[День 2] Статус: Закрыт, 5 млн сум (Иван)
```

### Действия

- Изменить статус (модалка)
- Переназначить менеджера (модалка)
- Удалить лид (confirm)

---

## 5. Дилеры `/dashboard/dealers`

### Таблица

Колонки:

- Название
- Город / Регион
- Владелец (имя, телефон)
- Статус (active/inactive)
- Кол-во лидов
- Конверсия
- Действия

### Кнопка "Добавить дилера"

→ `/dashboard/dealers/create`

### Действия

- Редактировать: `/dashboard/dealers/[id]`
- Деактивировать/активировать
- Удалить (если нет лидов)

---

## 6. Добавить дилера `/dashboard/dealers/create`

### Форма

```typescript
{
  name: string,
  city: string,
  region?: string,
  address: string,
  owner_name: string,
  owner_phone: string,
  owner_email: string,
  status: 'active'
}
```

После создания → редирект `/dashboard/dealers`

---

## 7. Менеджеры `/dashboard/managers`

### Таблица

Колонки:

- ФИО
- Дилер
- Telegram (@username)
- Статус привязки (привязан/не привязан)
- Кол-во лидов
- Активен
- Действия

### Фильтр по дилеру

### Кнопка "Добавить менеджера"

→ `/dashboard/managers/create`

### Действия

- Редактировать: `/dashboard/managers/[id]`
- Деактивировать
- Удалить

---

## 8. Добавить менеджера `/dashboard/managers/create`

### Форма

```typescript
{
  full_name: string,
  email: string,
  phone: string,
  tenant_id: uuid (select дилера),
  telegram_username?: string (без @),
  role: 'manager',
  is_active: true
}
```

### Примечание

Telegram ID привязывается позже через бот (команда /start)

---

## Компоненты

- `components/tables/leads-table.tsx`
- `components/tables/dealers-table.tsx`
- `components/tables/managers-table.tsx`
- `components/forms/lead-create-form.tsx`
- `components/forms/dealer-form.tsx`
- `components/forms/manager-form.tsx`
- `components/dashboard/stats-cards.tsx`
- `components/dashboard/leads-chart.tsx`
