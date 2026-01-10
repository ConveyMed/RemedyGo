-- ============================================
-- ORGANIZATIONS TABLE SCHEMA
-- Run this FIRST before other SQL files (after users.sql)
-- ============================================
-- Two organizations: Antimicrobials and OsteoRemedies
-- Users belong to one org, content can be assigned to one or both

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,  -- Short codes: 'AM' or 'OR'
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for RemedyGo
INSERT INTO organizations (name, code, description) VALUES
  ('Antimicrobials', 'AM', 'Antimicrobials division'),
  ('OsteoRemedies', 'OR', 'OsteoRemedies division')
ON CONFLICT (code) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;

-- Policies
CREATE POLICY "Anyone can view active organizations" ON organizations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert organizations" ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_organizations_timestamp ON organizations;
CREATE TRIGGER trigger_update_organizations_timestamp
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();
