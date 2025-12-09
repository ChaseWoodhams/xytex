-- Add account_type column to accounts table
-- This distinguishes between single_location and multi_location accounts

-- Create enum type for account_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
        CREATE TYPE account_type_enum AS ENUM ('single_location', 'multi_location');
    END IF;
END $$;

-- Add account_type column with default value
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type account_type_enum DEFAULT 'single_location';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);

