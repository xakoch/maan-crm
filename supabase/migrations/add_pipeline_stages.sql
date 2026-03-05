-- ============================================
-- Pipeline Stages (customizable kanban columns)
-- ============================================

CREATE TABLE IF NOT EXISTS pipeline_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text NOT NULL,
    title text NOT NULL,
    color text NOT NULL DEFAULT 'gray',
    sort_order integer NOT NULL DEFAULT 0,
    crm_type text NOT NULL CHECK (crm_type IN ('lumara', 'maan')),
    is_system boolean NOT NULL DEFAULT false,
    is_final boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(slug, crm_type)
);

-- Enable RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Everyone can read pipeline stages
CREATE POLICY "Everyone can read pipeline_stages" ON pipeline_stages
    FOR SELECT USING (true);

-- Service role key handles mutations (via server actions)

-- ============================================
-- Change leads.status from enum to text
-- ============================================

-- Remove default first
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;

-- Convert enum to text
ALTER TABLE leads ALTER COLUMN status TYPE text USING status::text;

-- Set default back
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new';

-- ============================================
-- Seed default stages for Lumara
-- ============================================
INSERT INTO pipeline_stages (slug, title, color, sort_order, crm_type, is_system, is_final) VALUES
    ('new', 'Новые', 'blue', 0, 'lumara', true, false),
    ('processing', 'В работе', 'indigo', 1, 'lumara', false, false),
    ('closed', 'Закрыто', 'emerald', 2, 'lumara', false, true),
    ('rejected', 'Отказано', 'rose', 3, 'lumara', false, false);

-- ============================================
-- Seed default stages for MAAN
-- ============================================
INSERT INTO pipeline_stages (slug, title, color, sort_order, crm_type, is_system, is_final) VALUES
    ('new', 'Новые', 'blue', 0, 'maan', true, false),
    ('processing', 'В работе', 'indigo', 1, 'maan', false, false),
    ('closed', 'Закрыто', 'emerald', 2, 'maan', false, true),
    ('rejected', 'Отказано', 'rose', 3, 'maan', false, false);
