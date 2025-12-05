-- Add code columns to corporate_accounts and locations
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Create indexes for code columns
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_code ON corporate_accounts(code);
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);

-- Function to generate unique account code (XYB-XXXX format)
CREATE OR REPLACE FUNCTION generate_account_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_code TEXT;
BEGIN
  -- Find the highest number in existing codes
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM corporate_accounts
  WHERE code IS NOT NULL AND code ~ '^XYB-[0-9]+$';
  
  -- Format as XYB-XXXX (4 digits, zero-padded)
  new_code := 'XYB-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique location code (XYB-XXXX format)
CREATE OR REPLACE FUNCTION generate_location_code(p_account_code TEXT)
RETURNS TEXT AS $$
DECLARE
  account_prefix TEXT;
  next_num INTEGER;
  new_code TEXT;
BEGIN
  -- Extract the numeric part from account code (e.g., "0001" from "XYB-0001")
  account_prefix := SUBSTRING(p_account_code FROM 5);
  
  -- Find the highest number for locations under this account
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM locations
  WHERE corporate_account_id IN (
    SELECT id FROM corporate_accounts WHERE code = p_account_code
  )
  AND code IS NOT NULL 
  AND code ~ '^XYB-[0-9]+$';
  
  -- Format as XYB-XXXX (4 digits, zero-padded)
  -- For locations, we'll use a sequential number that's unique across all locations
  -- but we can optionally prefix with account number if needed
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM locations
  WHERE code IS NOT NULL AND code ~ '^XYB-[0-9]+$';
  
  new_code := 'XYB-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate account code
CREATE OR REPLACE FUNCTION set_account_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_account_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate location code
CREATE OR REPLACE FUNCTION set_location_code()
RETURNS TRIGGER AS $$
DECLARE
  account_code TEXT;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    -- Get the parent account code
    SELECT ca.code INTO account_code
    FROM corporate_accounts ca
    WHERE ca.id = NEW.corporate_account_id;
    
    -- Generate location code
    NEW.code := generate_location_code(account_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_set_account_code ON corporate_accounts;
CREATE TRIGGER trigger_set_account_code
  BEFORE INSERT ON corporate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_account_code();

DROP TRIGGER IF EXISTS trigger_set_location_code ON locations;
CREATE TRIGGER trigger_set_location_code
  BEFORE INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION set_location_code();

