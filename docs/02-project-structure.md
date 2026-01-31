# Структура проекта

```
/app
  /page.tsx                              # Редирект на /lead-form
  /layout.tsx
  
  /(public)
    /lead-form/page.tsx                  # Публичная форма
    /thank-you/page.tsx                  # Спасибо
  
  /(auth)
    /login/page.tsx                      # Вход
  
  /dashboard
    /layout.tsx                          # Общий layout
  
    /(super-admin)
      /page.tsx                          # Dashboard супер-админа
      /leads
        /page.tsx                        # Таблица лидов
        /create/page.tsx                 # Добавить лид
        /[id]/page.tsx                   # Детали лида
      /dealers
        /page.tsx                        # Таблица дилеров
        /create/page.tsx                 # Добавить дилера
        /[id]/page.tsx                   # Редактировать дилера
      /managers
        /page.tsx                        # Таблица менеджеров
        /create/page.tsx                 # Добавить менеджера
        /[id]/page.tsx                   # Редактировать менеджера
  
    /(dealer)
      /dealer
        /page.tsx                        # Dashboard дилера
        /leads
          /page.tsx                      # Лиды дилера
          /[id]/page.tsx                 # Детали лида
        /managers
          /page.tsx                      # Менеджеры
          /[id]/page.tsx                 # Редактировать
        /profile/page.tsx                # Профиль
  
  /api
    /auth/login/route.ts
    /leads/route.ts                      # GET/POST
    /leads/[id]/route.ts                 # GET/PATCH/DELETE
    /dealers/route.ts
    /dealers/[id]/route.ts
    /managers/route.ts
    /managers/[id]/route.ts
    /stats/route.ts
    /telegram/webhook/route.ts

/components
  /ui/                                   # Shadcn
  /auth/login-form.tsx
  /forms
    /lead-form.tsx                       # Публичная
    /lead-create-form.tsx                # Админ
    /dealer-form.tsx
    /manager-form.tsx
  /tables
    /leads-table.tsx
    /dealers-table.tsx
    /managers-table.tsx
  /dashboard
    /stats-cards.tsx
    /leads-chart.tsx
  /layout
    /navbar.tsx
    /sidebar.tsx

/lib
  /supabase
    /client.ts
    /server.ts
  /telegram
    /bot.ts
    /notifications.ts
  /auth.ts
  /utils.ts

/types
  /database.types.ts
  /index.ts

/middleware.ts
```
