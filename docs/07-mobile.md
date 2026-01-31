# Мобильная адаптация

## Требования

Все страницы должны корректно отображаться на мобильных (320px+).

---

## Публичная форма

- Полноэкранная форма
- Большие touch-friendly кнопки (min 44px)
- Автозум отключен (viewport)
- Клавиатура tel для телефона

---

## Dashboard

- Sidebar → Drawer (гамбургер-меню)
- Карточки статистики: 2 в ряд (на мобиле - по 1)
- Таблицы: horizontal scroll или карточки
- Фильтры: collapse/expand

---

## Таблицы

Вариант 1: Горизонтальный скролл

```tsx
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

Вариант 2: Карточки (лучше для мобильных)

```tsx
<div className="grid gap-4">
  {leads.map(lead => (
    <Card key={lead.id}>
      <CardHeader>
        <CardTitle>{lead.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Телефон: {lead.phone}</p>
        <p>Статус: {lead.status}</p>
        <Button>Открыть</Button>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## Общие правила

```css
/* Базовые стили */
body {
  font-size: 16px; /* Не менее 16px для избежания автозума */
}

button {
  min-height: 44px; /* Минимальный размер для touch */
  min-width: 44px;
}

/* Брейкпоинты */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

## Тестирование

- Chrome DevTools (responsive mode)
- Реальные устройства (Android/iOS)
- Проверить: iPhone SE (320px), iPhone 12 (390px), iPad (768px)
