-- ============================================
-- Deleted Leads Archive
-- ============================================

CREATE TABLE IF NOT EXISTS deleted_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    original_lead_id uuid NOT NULL,
    lead_data jsonb NOT NULL,
    deletion_reason text NOT NULL,
    deleted_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE deleted_leads ENABLE ROW LEVEL SECURITY;

-- Super admin can read all
CREATE POLICY "Super admin can read deleted_leads" ON deleted_leads
    FOR SELECT USING (true);

-- Service role handles inserts
