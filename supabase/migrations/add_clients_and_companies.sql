-- ============================================
-- Таблица: companies (Компании)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    inn TEXT,
    address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Индексы companies
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON public.companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- RLS companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_companies" ON public.companies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

CREATE POLICY "dealer_tenant_access_companies" ON public.companies
    FOR ALL
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'dealer'
        )
    );

CREATE POLICY "manager_tenant_read_companies" ON public.companies
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'manager'
        )
    );

-- ============================================
-- Таблица: clients (Клиенты)
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    client_type TEXT NOT NULL DEFAULT 'person' CHECK (client_type IN ('person', 'organization')),
    inn TEXT,
    address TEXT,
    city TEXT,
    region TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    assigned_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comment TEXT,
    total_deal_value NUMERIC DEFAULT 0,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Индексы clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_manager_id ON public.clients(assigned_manager_id);
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON public.clients(lead_id);

-- RLS clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_clients" ON public.clients
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

CREATE POLICY "dealer_tenant_access_clients" ON public.clients
    FOR ALL
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'dealer'
        )
    );

CREATE POLICY "manager_own_clients" ON public.clients
    FOR ALL
    TO authenticated
    USING (
        assigned_manager_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'manager'
        )
    );

-- ============================================
-- Триггер updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
