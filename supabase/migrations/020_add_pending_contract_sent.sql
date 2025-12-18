-- Add pending_contract_sent field to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS pending_contract_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN accounts.pending_contract_sent IS 'Indicates if a contract has been sent and is pending for single-location accounts';

-- Add pending_contract_sent field to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS pending_contract_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN locations.pending_contract_sent IS 'Indicates if a contract has been sent and is pending for this location (used for multi-location accounts)';

