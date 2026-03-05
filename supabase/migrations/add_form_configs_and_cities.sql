-- ============================================
-- Table: cities (managed via settings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_uz TEXT NOT NULL,
    region TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cities_region ON public.cities(region);
CREATE INDEX IF NOT EXISTS idx_cities_is_active ON public.cities(is_active);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_cities" ON public.cities
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

CREATE POLICY "public_read_active_cities" ON public.cities
    FOR SELECT TO anon
    USING (is_active = true);

-- ============================================
-- Table: form_configs (managed via settings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.form_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_ru TEXT NOT NULL,
    title_uz TEXT NOT NULL,
    subtitle_ru TEXT,
    subtitle_uz TEXT,
    crm_type TEXT NOT NULL DEFAULT 'lumara' CHECK (crm_type IN ('lumara', 'maan')),
    enabled_fields TEXT[] NOT NULL DEFAULT '{name,phone}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_form_configs_slug ON public.form_configs(slug);
CREATE INDEX IF NOT EXISTS idx_form_configs_is_active ON public.form_configs(is_active);

ALTER TABLE public.form_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_form_configs" ON public.form_configs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

CREATE POLICY "public_read_active_form_configs" ON public.form_configs
    FOR SELECT TO anon
    USING (is_active = true);

-- ============================================
-- Add form_config_id to leads
-- ============================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS form_config_id UUID REFERENCES public.form_configs(id) ON DELETE SET NULL;

-- ============================================
-- Seed existing form configs
-- ============================================
INSERT INTO public.form_configs (slug, title_ru, title_uz, subtitle_ru, subtitle_uz, crm_type, enabled_fields, is_active) VALUES
    ('lead-form', 'Узнать стоимость', 'Narxini bilish', 'Заполните форму, и мы подберем для вас лучшее предложение', 'Formani to''ldiring va biz siz uchun eng yaxshi taklifni tanlaymiz', 'lumara', '{name,phone,city}', true),
    ('maan-form', 'Оставить заявку', 'Ariza qoldirish', 'Заполните форму, и мы свяжемся с вами', 'Formani to''ldiring va biz siz bilan bog''lanamiz', 'maan', '{name,phone}', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Seed cities from existing hardcoded data
-- (Only seeding the 7 active regions that were in the lead form)
-- ============================================
INSERT INTO public.cities (name_ru, name_uz, region, is_active, sort_order) VALUES
-- Ташкент (город) - districts
('Бектемир', 'Bektemir', 'tashkent_city', true, 1),
('Чиланзар', 'Chilonzor', 'tashkent_city', true, 2),
('Мирабад', 'Mirobod', 'tashkent_city', true, 3),
('Мирзо-Улугбек', 'Mirzo Ulug''bek', 'tashkent_city', true, 4),
('Алмазар', 'Olmazor', 'tashkent_city', true, 5),
('Сергели', 'Sergeli', 'tashkent_city', true, 6),
('Шайхантахур', 'Shayxontohur', 'tashkent_city', true, 7),
('Учтепа', 'Uchtepa', 'tashkent_city', true, 8),
('Яккасарай', 'Yakkasaroy', 'tashkent_city', true, 9),
('Яшнабад', 'Yashnobod', 'tashkent_city', true, 10),
('Юнусабад', 'Yunusobod', 'tashkent_city', true, 11),
('Янгихаёт', 'Yangihayot', 'tashkent_city', true, 12)
ON CONFLICT DO NOTHING;

-- Regions table for grouping cities
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_ru TEXT NOT NULL,
    name_uz TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    has_districts BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_regions" ON public.regions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

CREATE POLICY "public_read_active_regions" ON public.regions
    FOR SELECT TO anon
    USING (is_active = true);

-- Seed regions
INSERT INTO public.regions (slug, name_ru, name_uz, is_active, sort_order, has_districts) VALUES
('tashkent_city', 'Ташкент (город)', 'Toshkent shahar', true, 1, true),
('tashkent_region', 'Ташкентская область', 'Toshkent viloyat', true, 2, false),
('samarkand', 'Самарканд', 'Samarqand', true, 3, false),
('kashkadarya', 'Кашкадарья', 'Qashqadaryo', true, 4, false),
('namangan', 'Наманган', 'Namangan', true, 5, false),
('jizzakh', 'Джизак', 'Jizzax', true, 6, false),
('surkhandarya', 'Сурхандарья', 'Surxandaryo', true, 7, false),
('bukhara', 'Бухара', 'Buxoro', false, 8, false),
('navoi', 'Навои', 'Navoiy', false, 9, false),
('fergana', 'Фергана', 'Farg''ona', false, 10, false),
('andijan', 'Андижан', 'Andijon', false, 11, false),
('khorezm', 'Хорезм', 'Xorazm', false, 12, false),
('karakalpakstan', 'Каракалпакстан', 'Qoraqalpog''iston', false, 13, false),
('sirdarya', 'Сырдарья', 'Sirdaryo', false, 14, false)
ON CONFLICT (slug) DO NOTHING;
