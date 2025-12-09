-- Comprehensive migration to fix all corporate_accounts references
-- This migration is idempotent and safe to run multiple times
-- It handles both scenarios: table is 'accounts' or 'corporate_accounts'

-- Step 1: Drop all old RLS policies on corporate_accounts (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        DROP POLICY IF EXISTS "BD team and admins can view all corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can insert corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can update corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can delete corporate accounts" ON corporate_accounts;
    END IF;
END $$;

-- Step 2: Drop all old triggers on corporate_accounts (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        DROP TRIGGER IF EXISTS update_corporate_accounts_updated_at ON corporate_accounts;
    END IF;
END $$;

-- Step 3: Drop all old indexes on corporate_accounts (safe, uses IF EXISTS)
DROP INDEX IF EXISTS idx_corporate_accounts_status;
DROP INDEX IF EXISTS idx_corporate_accounts_deal_stage;
DROP INDEX IF EXISTS idx_corporate_accounts_created_by;

-- Step 4: Ensure RLS policies exist on accounts table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        -- Drop existing policies first to avoid conflicts
        DROP POLICY IF EXISTS "BD team and admins can view all corporate accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can insert corporate accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can update corporate accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can delete corporate accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can view all accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can insert accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can update accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can delete accounts" ON accounts;
        
        -- Create policies on accounts table
        CREATE POLICY "BD team and admins can view all accounts" ON accounts
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN ('bd_team', 'admin')
            )
          );

        CREATE POLICY "BD team and admins can insert accounts" ON accounts
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN ('bd_team', 'admin')
            )
            AND created_by = auth.uid()
          );

        CREATE POLICY "BD team and admins can update accounts" ON accounts
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN ('bd_team', 'admin')
            )
          );

        CREATE POLICY "BD team and admins can delete accounts" ON accounts
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN ('bd_team', 'admin')
            )
          );
    END IF;
END $$;

-- Step 5: Ensure trigger exists on accounts table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        -- Drop old triggers first
        DROP TRIGGER IF EXISTS update_corporate_accounts_updated_at ON accounts;
        DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
        
        -- Create trigger on accounts
        CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 6: Ensure indexes exist on accounts table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        -- Create indexes on accounts (IF NOT EXISTS is safe)
        CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
        CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);
        -- Note: deal_stage index is not created as that column was removed
    END IF;
END $$;

-- Step 7: Ensure RLS is enabled on accounts table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 8: Fix foreign key constraints in activities and notes tables
-- Note: PostgreSQL automatically updates foreign key constraints when a table is renamed,
-- but we'll verify and fix if needed. Foreign keys can't be easily changed, so we'll
-- check if they exist and are correct. If the table was renamed, the foreign keys should
-- have been updated automatically. If not, we'll need to handle it.

-- Check and fix activities table foreign key (if needed)
DO $$ 
DECLARE
    fk_constraint_name TEXT;
    accounts_table_name TEXT;
BEGIN
    -- Determine which table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        RETURN; -- Neither table exists, skip
    END IF;
    
    -- Check if activities table exists and has the foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        -- Find the foreign key constraint name
        SELECT conname INTO fk_constraint_name
        FROM pg_constraint
        WHERE conrelid = 'activities'::regclass
          AND confrelid = accounts_table_name::regclass
          AND contype = 'f'
        LIMIT 1;
        
        -- If foreign key doesn't exist or points to wrong table, we'd need to recreate it
        -- But since PostgreSQL auto-updates FKs on rename, this should be fine
        -- We'll just verify the constraint exists
        IF fk_constraint_name IS NULL AND accounts_table_name = 'accounts' THEN
            -- This shouldn't happen if migration 005 ran correctly, but log it
            RAISE NOTICE 'Foreign key from activities to accounts not found - may need manual fix';
        END IF;
    END IF;
END $$;

-- Check and fix notes table foreign key (if needed)
DO $$ 
DECLARE
    fk_constraint_name TEXT;
    accounts_table_name TEXT;
BEGIN
    -- Determine which table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        RETURN; -- Neither table exists, skip
    END IF;
    
    -- Check if notes table exists and has the foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
        -- Find the foreign key constraint name
        SELECT conname INTO fk_constraint_name
        FROM pg_constraint
        WHERE conrelid = 'notes'::regclass
          AND confrelid = accounts_table_name::regclass
          AND contype = 'f'
        LIMIT 1;
        
        -- If foreign key doesn't exist or points to wrong table, we'd need to recreate it
        -- But since PostgreSQL auto-updates FKs on rename, this should be fine
        -- We'll just verify the constraint exists
        IF fk_constraint_name IS NULL AND accounts_table_name = 'accounts' THEN
            -- This shouldn't happen if migration 005 ran correctly, but log it
            RAISE NOTICE 'Foreign key from notes to accounts not found - may need manual fix';
        END IF;
    END IF;
END $$;

