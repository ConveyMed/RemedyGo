-- Add invite_code to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invite_code VARCHAR(50);

-- Set default codes (change these in admin panel)
UPDATE organizations SET invite_code = 'antimicro2024' WHERE code = 'AM';
UPDATE organizations SET invite_code = 'osteo2024' WHERE code = 'OR';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON organizations(invite_code);

-- Function to verify invite code and assign user to org
CREATE OR REPLACE FUNCTION verify_invite_code(p_user_id UUID, p_invite_code VARCHAR)
RETURNS JSON AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
BEGIN
  -- Find organization with this invite code
  SELECT id, name INTO v_org_id, v_org_name
  FROM organizations
  WHERE invite_code = p_invite_code AND is_active = true;

  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid organization code');
  END IF;

  -- Update user with organization
  UPDATE users
  SET organization_id = v_org_id
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'organization_id', v_org_id, 'organization_name', v_org_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
