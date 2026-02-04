-- Add B2B support columns to the leads table
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "company_name" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lead_type" text DEFAULT 'person' CHECK (lead_type IN ('person', 'organization'));
