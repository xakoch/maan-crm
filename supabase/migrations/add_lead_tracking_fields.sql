ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_device_type ON leads(device_type);
