-- Seed Content for RemedyGo
-- Run this after content.sql and content_assignments.sql

-- Get org IDs
DO $$
DECLARE
  am_org_id UUID;
  or_org_id UUID;
  cat_id UUID;
  item_id UUID;
BEGIN
  -- Get organization IDs
  SELECT id INTO am_org_id FROM organizations WHERE code = 'AM';
  SELECT id INTO or_org_id FROM organizations WHERE code = 'OR';

  -- ===================
  -- LIBRARY CATEGORIES
  -- ===================

  -- Category: Product Information
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Product Information', 'library', 1, true)
  RETURNING id INTO cat_id;

  -- Sample items for Product Information
  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Antimicrobial Product Guide', 'Complete guide to our antimicrobial products', 'https://example.com/files/am-guide.pdf', 1, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 1);

  INSERT INTO content_items (id, title, description, external_link, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Dosage Calculator', 'Interactive dosage reference', 'https://example.com/dosage', 2, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 2);

  -- Category: Sales Materials
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Sales Materials', 'library', 2, true)
  RETURNING id INTO cat_id;

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Sales Presentation 2024', 'Updated sales deck', 'https://example.com/files/sales-deck.pdf', 1, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 1);

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Competitor Analysis', 'Market comparison sheet', 'https://example.com/files/competitor.pdf', 2, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 2);

  -- Category: Clinical Studies (Both orgs)
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Clinical Studies', 'library', 3, true)
  RETURNING id INTO cat_id;

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Efficacy Study 2023', 'Clinical trial results', 'https://example.com/files/study.pdf', 1, true)
  RETURNING id INTO item_id;
  -- Assign to both orgs
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 1);
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, or_org_id, cat_id, 1);

  -- Category: OsteoRemedies Products (OR only)
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'OR Product Line', 'library', 4, true)
  RETURNING id INTO cat_id;

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Bone Graft Catalog', 'Full product catalog', 'https://example.com/files/or-catalog.pdf', 1, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, or_org_id, cat_id, 1);

  -- ===================
  -- TRAINING CATEGORIES
  -- ===================

  -- Category: Onboarding (Both orgs)
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Onboarding', 'training', 1, true)
  RETURNING id INTO cat_id;

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Welcome Video', 'Introduction to the company', 'https://example.com/videos/welcome.mp4', 1, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 1);
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, or_org_id, cat_id, 1);

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Company Policies', 'HR policies and procedures', 'https://example.com/files/policies.pdf', 2, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 2);
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, or_org_id, cat_id, 2);

  -- Category: Product Training (AM)
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Product Training', 'training', 2, true)
  RETURNING id INTO cat_id;

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Antimicrobial Basics', 'Foundation training module', 'https://example.com/videos/am-basics.mp4', 1, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 1);

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Advanced Techniques', 'Advanced sales techniques', 'https://example.com/videos/advanced.mp4', 2, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 2);

  -- Category: Compliance (Both orgs)
  INSERT INTO content_categories (id, title, type, sort_order, is_active)
  VALUES (gen_random_uuid(), 'Compliance', 'training', 3, true)
  RETURNING id INTO cat_id;

  INSERT INTO content_items (id, title, description, file_url, sort_order, is_active)
  VALUES (gen_random_uuid(), 'HIPAA Training', 'Required annual training', 'https://example.com/videos/hipaa.mp4', 1, true)
  RETURNING id INTO item_id;
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, am_org_id, cat_id, 1);
  INSERT INTO content_item_assignments (content_item_id, organization_id, category_id, sort_order)
  VALUES (item_id, or_org_id, cat_id, 1);

  RAISE NOTICE 'Content seeded successfully!';
END $$;
