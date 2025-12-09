-- Remove deal_stage column from accounts table (or corporate_accounts if not yet renamed)
-- This migration handles both table names to support different migration orders
DO $$ 
BEGIN
    -- Try to drop from accounts first (if migration 005 has run)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        ALTER TABLE accounts DROP COLUMN IF EXISTS deal_stage;
    -- Otherwise try corporate_accounts (if migration 005 hasn't run yet)
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        ALTER TABLE corporate_accounts DROP COLUMN IF EXISTS deal_stage;
    END IF;
END $$;

-- Note: We're keeping the deal_stage_enum type in case it's used elsewhere
-- If you want to remove it completely, uncomment the line below:
-- DROP TYPE IF EXISTS deal_stage_enum;

