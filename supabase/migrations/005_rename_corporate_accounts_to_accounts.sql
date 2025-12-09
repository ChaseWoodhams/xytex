-- Drop old RLS policies (before renaming table)
-- Use DO block to safely drop policies even if table has been renamed
DO $$ 
BEGIN
    -- Try to drop policies from corporate_accounts if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        DROP POLICY IF EXISTS "BD team and admins can view all corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can insert corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can update corporate accounts" ON corporate_accounts;
        DROP POLICY IF EXISTS "BD team and admins can delete corporate accounts" ON corporate_accounts;
        
        -- Drop old trigger (before renaming table)
        DROP TRIGGER IF EXISTS update_corporate_accounts_updated_at ON corporate_accounts;
        
        -- Rename corporate_accounts table to accounts
        ALTER TABLE corporate_accounts RENAME TO accounts;
    END IF;
END $$;

-- Rename foreign key columns in related tables (only if they exist)
DO $$ 
BEGIN
    -- Rename location column if it exists and hasn't been renamed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'corporate_account_id') THEN
        ALTER TABLE locations RENAME COLUMN corporate_account_id TO account_id;
    END IF;
    
    -- Rename agreement column if it exists and hasn't been renamed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'corporate_account_id') THEN
        ALTER TABLE agreements RENAME COLUMN corporate_account_id TO account_id;
    END IF;
    
    -- Rename activity column if it exists and hasn't been renamed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'corporate_account_id') THEN
        ALTER TABLE activities RENAME COLUMN corporate_account_id TO account_id;
    END IF;
    
    -- Rename note column if it exists and hasn't been renamed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'corporate_account_id') THEN
        ALTER TABLE notes RENAME COLUMN corporate_account_id TO account_id;
    END IF;
END $$;

-- Drop old indexes (these are safe to run even if they don't exist)
DROP INDEX IF EXISTS idx_corporate_accounts_status;
DROP INDEX IF EXISTS idx_corporate_accounts_deal_stage;
DROP INDEX IF EXISTS idx_corporate_accounts_created_by;
DROP INDEX IF EXISTS idx_locations_account_id;
DROP INDEX IF EXISTS idx_agreements_account_id;
DROP INDEX IF EXISTS idx_activities_account_id;
DROP INDEX IF EXISTS idx_notes_account_id;

-- Create new indexes with updated names
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_locations_account_id ON locations(account_id);
CREATE INDEX IF NOT EXISTS idx_agreements_account_id ON agreements(account_id);
CREATE INDEX IF NOT EXISTS idx_activities_account_id ON activities(account_id);
CREATE INDEX IF NOT EXISTS idx_notes_account_id ON notes(account_id);

-- Create new RLS policies with updated names (drop first if they exist)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "BD team and admins can view all accounts" ON accounts;
    DROP POLICY IF EXISTS "BD team and admins can insert accounts" ON accounts;
    DROP POLICY IF EXISTS "BD team and admins can update accounts" ON accounts;
    DROP POLICY IF EXISTS "BD team and admins can delete accounts" ON accounts;
    
    -- Create new policies
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
END $$;

-- Create new trigger with updated name (drop first if it exists)
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

