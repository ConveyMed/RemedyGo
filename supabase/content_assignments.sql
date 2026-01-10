-- ============================================
-- CONTENT ITEM ASSIGNMENTS (Organization + Category)
-- Run this AFTER organizations.sql and content.sql
-- ============================================
-- Flexible assignment: same file can be in different categories per org
-- Example: "Product Guide.pdf" can be:
--   - AM org: "What's New", "Sales Sheets"
--   - OR org: "Onboarding", "Sales Process"

-- Junction table for content items to organizations and categories
CREATE TABLE IF NOT EXISTS content_item_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_item_id, organization_id, category_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_assignments_item ON content_item_assignments(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_org ON content_item_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_category ON content_item_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_org_category ON content_item_assignments(organization_id, category_id);

-- Enable RLS
ALTER TABLE content_item_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view assignments for their org" ON content_item_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON content_item_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments" ON content_item_assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON content_item_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON content_item_assignments;

-- Regular users see assignments for their org only
CREATE POLICY "Users can view assignments for their org" ON content_item_assignments
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_full_line = true)
    )
  );

-- Admins can manage all assignments
CREATE POLICY "Admins can insert assignments" ON content_item_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_owner = true)
    )
  );

CREATE POLICY "Admins can update assignments" ON content_item_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_owner = true)
    )
  );

CREATE POLICY "Admins can delete assignments" ON content_item_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_owner = true)
    )
  );

-- ============================================
-- HELPER VIEW: Content with org assignments
-- ============================================
-- Easy way to query content by org and category
CREATE OR REPLACE VIEW content_by_organization AS
SELECT
  ci.id AS content_id,
  ci.title,
  ci.description,
  ci.thumbnail_url,
  ci.file_url,
  ci.file_name,
  ci.external_link,
  ci.external_link_label,
  ci.quiz_link,
  ci.quiz_link_label,
  ci.is_downloadable,
  ci.use_company_logo,
  ci.is_active,
  ci.created_at,
  cia.organization_id,
  o.name AS organization_name,
  o.code AS organization_code,
  cia.category_id,
  cc.title AS category_title,
  cc.type AS category_type,
  cia.sort_order
FROM content_items ci
JOIN content_item_assignments cia ON ci.id = cia.content_item_id
JOIN organizations o ON cia.organization_id = o.id
JOIN content_categories cc ON cia.category_id = cc.id
WHERE ci.is_active = true AND o.is_active = true AND cc.is_active = true;

-- ============================================
-- FUNCTION: Assign content to org + categories
-- ============================================
-- Convenience function to assign a content item to an org with multiple categories
CREATE OR REPLACE FUNCTION assign_content_to_org(
  p_content_item_id UUID,
  p_organization_id UUID,
  p_category_ids UUID[],
  p_sort_orders INTEGER[] DEFAULT NULL
)
RETURNS SETOF content_item_assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
  v_sort_order INTEGER;
  v_index INTEGER := 1;
BEGIN
  -- Loop through each category and create assignment
  FOREACH v_category_id IN ARRAY p_category_ids
  LOOP
    -- Get sort order (default to 0 if not provided)
    IF p_sort_orders IS NOT NULL AND v_index <= array_length(p_sort_orders, 1) THEN
      v_sort_order := p_sort_orders[v_index];
    ELSE
      v_sort_order := 0;
    END IF;

    -- Insert or update assignment
    INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
    VALUES (p_content_item_id, p_organization_id, v_category_id, v_sort_order)
    ON CONFLICT (content_item_id, organization_id, category_id)
    DO UPDATE SET sort_order = EXCLUDED.sort_order
    RETURNING * INTO STRICT v_category_id; -- Just to trigger the return

    v_index := v_index + 1;
  END LOOP;

  -- Return all assignments for this content item in this org
  RETURN QUERY
  SELECT * FROM content_item_assignments
  WHERE content_item_id = p_content_item_id
  AND organization_id = p_organization_id;
END;
$$;

-- ============================================
-- FUNCTION: Get content for org by category
-- ============================================
CREATE OR REPLACE FUNCTION get_org_content(
  p_organization_code VARCHAR(10),
  p_category_type VARCHAR(20) DEFAULT NULL  -- 'library' or 'training' or NULL for all
)
RETURNS TABLE (
  content_id UUID,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  file_url TEXT,
  external_link TEXT,
  category_id UUID,
  category_title VARCHAR(255),
  sort_order INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ci.id,
    ci.title,
    ci.description,
    ci.thumbnail_url,
    ci.file_url,
    ci.external_link,
    cia.category_id,
    cc.title,
    cia.sort_order
  FROM content_items ci
  JOIN content_item_assignments cia ON ci.id = cia.content_item_id
  JOIN organizations o ON cia.organization_id = o.id
  JOIN content_categories cc ON cia.category_id = cc.id
  WHERE o.code = p_organization_code
    AND ci.is_active = true
    AND o.is_active = true
    AND cc.is_active = true
    AND (p_category_type IS NULL OR cc.type = p_category_type)
  ORDER BY cc.sort_order, cia.sort_order;
$$;
