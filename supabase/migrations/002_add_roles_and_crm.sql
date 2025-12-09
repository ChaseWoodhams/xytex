-- Create enum types for CRM
CREATE TYPE user_role_enum AS ENUM ('customer', 'bd_team', 'admin');
CREATE TYPE deal_stage_enum AS ENUM ('prospect', 'qualified', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE account_status_enum AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE location_status_enum AS ENUM ('active', 'inactive');
CREATE TYPE agreement_type_enum AS ENUM ('partnership', 'vendor', 'referral', 'other');
CREATE TYPE agreement_status_enum AS ENUM ('draft', 'active', 'expired', 'terminated');
CREATE TYPE activity_type_enum AS ENUM ('call', 'email', 'meeting', 'note', 'task', 'other');

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'customer';
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create corporate_accounts table (or accounts if it's already been renamed)
-- This migration handles both table names to support different migration orders
DO $$ 
BEGIN
    -- Only create the table if neither corporate_accounts nor accounts exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        CREATE TABLE corporate_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          website TEXT,
          industry TEXT,
          deal_stage deal_stage_enum DEFAULT 'prospect',
          annual_revenue NUMERIC,
          employee_count INTEGER,
          status account_status_enum DEFAULT 'active',
          primary_contact_name TEXT,
          primary_contact_email TEXT,
          primary_contact_phone TEXT,
          notes TEXT,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create locations table
-- Use a function to get the correct table name for foreign key reference
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    -- Determine which table name to use
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts'; -- Default for new installations
    END IF;
    
    -- Create locations table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        EXECUTE format('
            CREATE TABLE locations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              corporate_account_id UUID NOT NULL REFERENCES %I(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              address_line1 TEXT,
              address_line2 TEXT,
              city TEXT,
              state TEXT,
              zip_code TEXT,
              country TEXT DEFAULT ''USA'',
              phone TEXT,
              email TEXT,
              contact_name TEXT,
              contact_title TEXT,
              is_primary BOOLEAN DEFAULT FALSE,
              status location_status_enum DEFAULT ''active'',
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )', accounts_table_name);
    END IF;
END $$;

-- Create agreements table
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agreements') THEN
        EXECUTE format('
            CREATE TABLE agreements (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              corporate_account_id UUID NOT NULL REFERENCES %I(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  agreement_type agreement_type_enum NOT NULL,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  terms TEXT,
  revenue_share_percentage NUMERIC,
  monthly_fee NUMERIC,
  status agreement_status_enum DEFAULT 'draft',
  document_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )', accounts_table_name);
    END IF;
END $$;

-- Create activities table
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        EXECUTE format('
            CREATE TABLE activities (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              corporate_account_id UUID NOT NULL REFERENCES %I(id) ON DELETE CASCADE,
              location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
              activity_type activity_type_enum NOT NULL,
              subject TEXT NOT NULL,
              description TEXT,
              activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )', accounts_table_name);
    END IF;
END $$;

-- Create notes table
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
        EXECUTE format('
            CREATE TABLE notes (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              corporate_account_id UUID NOT NULL REFERENCES %I(id) ON DELETE CASCADE,
              location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
              title TEXT,
              content TEXT NOT NULL,
              is_private BOOLEAN DEFAULT FALSE,
              created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )', accounts_table_name);
    END IF;
END $$;

-- Create indexes for better query performance
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    -- Determine which table name to use
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    -- Create indexes on accounts/corporate_accounts table
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_corporate_accounts_status ON %I(status)', accounts_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_corporate_accounts_deal_stage ON %I(deal_stage)', accounts_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_corporate_accounts_created_by ON %I(created_by)', accounts_table_name);
END $$;

-- Create indexes on other tables (these don't depend on table name)
CREATE INDEX IF NOT EXISTS idx_locations_account_id ON locations(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_agreements_account_id ON agreements(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_agreements_location_id ON agreements(location_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_activities_account_id ON activities(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_activities_location_id ON activities(location_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_notes_account_id ON notes(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_notes_location_id ON notes(location_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);

-- Enable Row Level Security
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    -- Determine which table name to use
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    -- Enable RLS on accounts/corporate_accounts
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', accounts_table_name);
END $$;

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts/corporate_accounts
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    -- Determine which table name to use
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    -- Drop existing policies if they exist (to avoid conflicts)
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can view all corporate accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can insert corporate accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can update corporate accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can delete corporate accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can view all accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can insert accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can update accounts" ON %I', accounts_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "BD team and admins can delete accounts" ON %I', accounts_table_name);
    
    -- Create policies
    EXECUTE format('
        CREATE POLICY "BD team and admins can view all accounts" ON %I
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN (''bd_team'', ''admin'')
            )
          )', accounts_table_name);

    EXECUTE format('
        CREATE POLICY "BD team and admins can insert accounts" ON %I
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN (''bd_team'', ''admin'')
            )
            AND created_by = auth.uid()
          )', accounts_table_name);

    EXECUTE format('
        CREATE POLICY "BD team and admins can update accounts" ON %I
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN (''bd_team'', ''admin'')
            )
          )', accounts_table_name);

    EXECUTE format('
        CREATE POLICY "BD team and admins can delete accounts" ON %I
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN (''bd_team'', ''admin'')
            )
          )', accounts_table_name);
END $$;

-- RLS Policies for locations
CREATE POLICY "BD team and admins can view all locations" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can insert locations" ON locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can update locations" ON locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can delete locations" ON locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

-- RLS Policies for agreements
CREATE POLICY "BD team and admins can view all agreements" ON agreements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can insert agreements" ON agreements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "BD team and admins can update agreements" ON agreements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can delete agreements" ON agreements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

-- RLS Policies for activities
CREATE POLICY "BD team and admins can view all activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can insert activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "BD team and admins can update activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can delete activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

-- RLS Policies for notes
CREATE POLICY "BD team and admins can view notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
    AND (
      NOT is_private OR created_by = auth.uid()
    )
  );

CREATE POLICY "BD team and admins can insert notes" ON notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "BD team and admins can update own notes" ON notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "BD team and admins can delete own notes" ON notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
    AND created_by = auth.uid()
  );

-- Create triggers for updated_at
DO $$ 
DECLARE
    accounts_table_name TEXT;
BEGIN
    -- Determine which table name to use
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        accounts_table_name := 'accounts';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_accounts') THEN
        accounts_table_name := 'corporate_accounts';
    ELSE
        accounts_table_name := 'corporate_accounts';
    END IF;
    
    -- Drop old trigger if it exists
    EXECUTE format('DROP TRIGGER IF EXISTS update_corporate_accounts_updated_at ON %I', accounts_table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS update_accounts_updated_at ON %I', accounts_table_name);
    
    -- Create trigger on accounts/corporate_accounts
    EXECUTE format('
        CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON %I
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', accounts_table_name);
END $$;

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

