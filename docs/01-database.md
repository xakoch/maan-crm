# База данных

## Схема

-- ⚠️ ОСТОРОЖНО: ЭТОТ СКРИПТ УДАЛИТ ВСЕ ДАННЫЕ
DROP TABLE IF EXISTS lead_history CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Дилеры
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  address TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'dealer', 'manager')),
  tenant_id UUID REFERENCES tenants(id),
  telegram_id BIGINT UNIQUE,
  telegram_username TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Лиды
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  tenant_id UUID REFERENCES tenants(id),
  assigned_manager_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processing', 'closed', 'rejected')),
  rejection_reason TEXT,
  conversion_value DECIMAL(12,2),
  source TEXT DEFAULT 'website',
  comment TEXT,
  sent_to_telegram BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- История
CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  old_status TEXT,
  new_status TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_users_telegram ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);

-- RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Супер-админ видит всё
CREATE POLICY "super_admin_leads" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "super_admin_tenants" ON tenants FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "super_admin_users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND role = 'super_admin')
);

-- 2. Дилер видит только свои лиды
CREATE POLICY "dealer_leads" ON leads FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'dealer')
);

-- 3. Дилер видит своих менеджеров
CREATE POLICY "dealer_managers" ON users FOR ALL USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'dealer')
  AND role = 'manager'
);

-- 4. Менеджер видит назначенные лиды
CREATE POLICY "manager_leads" ON leads FOR SELECT USING (
  assigned_manager_id = auth.uid()
);

-- 5. Менеджер может обновлять статус своих лидов
CREATE POLICY "manager_update_leads" ON leads FOR UPDATE USING (
  assigned_manager_id = auth.uid()
);

-- 6. ПУБЛИЧНЫЙ ДОСТУП: Любой может создать лид (для формы на сайте)
CREATE POLICY "public_insert_leads" ON leads FOR INSERT WITH CHECK (true);

-- СОЗДАНИЕ ПЕРВОГО ПОЛЬЗОВАТЕЛЯ (SUPER ADMIN)
-- 1. Сначала создайте пользователя в Authentication -> Users в панели Supabase
-- 2. Скопируйте его User UID
-- 3. Выполните запрос ниже, заменив 'YOUR_USER_UID_HERE' на реальный UID
-- INSERT INTO users (id, email, role, full_name)
-- VALUES ('YOUR_USER_UID_HERE', 'admin@example.com', 'super_admin', 'Super Admin');


## Типы (для справки)

```typescript
type Role = 'super_admin' | 'dealer' | 'manager';
type LeadStatus = 'new' | 'processing' | 'closed' | 'rejected';
type TenantStatus = 'active' | 'inactive';
type LeadSource = 'website' | 'instagram' | 'facebook' | 'manual' | 'other';
```
