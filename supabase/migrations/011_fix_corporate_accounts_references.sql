-- Migration to fix any remaining references to corporate_accounts
-- This migration makes all operations idempotent and handles both table names

-- Fix indexes - drop old ones and create new ones with correct table name
DO $$ 
BEGIN
    -- Drop indexes on corporate_accounts if they exist
    DROP INDEX IF EXISTS idx_corporate_accounts_status;
    DROP INDEX IF EXISTS idx_corporate_accounts_deal_stage;
    DROP INDEX IF EXISTS idx_corporate_accounts_created_by;
    
    -- Create indexes on accounts if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
        CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);
        -- Note: deal_stage was removed, so we don't create that index
    END IF;
END $$;

-- Fix RLS - drop policies on corporate_accounts and ensure they exist on accounts
DO $$ 
BEGIN
    -- Drop old policies if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        DROP POLICY IF EXISTS "BD team and admins can view all corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can insert corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can update corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can delete corporate accounts" ON corporate_accounts;
    END IF;
    
    -- Ensure policies exist on accounts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        -- Drop existing policies first to avoid conflicts
        DROP POLICY IF EXISTS "BD team and admins can view all accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can insert accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can update accounts" ON accounts;
        DROP POLICY IF EXISTS "BD team and admins can delete accounts" ON accounts;
        
        -- Create policies
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

-- Fix triggers
DO $$ 
BEGIN
    -- Drop old trigger if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        DROP TRIGGER IF EXISTS update_corporate_accounts_updated_at ON corporate_accounts;
    END IF;
    
    -- Ensure trigger exists on accounts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
        CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on accounts if not already enabled
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

