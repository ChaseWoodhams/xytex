-- Add sage_code field to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sage_code TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_sage_code ON accounts(sage_code);

