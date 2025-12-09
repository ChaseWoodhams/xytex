-- Migration: Enforce Location-Only Agreements
-- This migration ensures all agreements are tied to locations, not accounts
-- Contracts are only with locations, never with the larger network/organization

-- Step 1: Migrate any existing account-level agreements to their primary location
-- If an agreement has account_id but no location_id, assign it to the account's primary location
UPDATE agreements
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.account_id = agreements.account_id
  AND l.is_primary = TRUE
  LIMIT 1
)
WHERE location_id IS NULL
AND account_id IS NOT NULL;

-- If no primary location exists, assign to the first location
UPDATE agreements
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.account_id = agreements.account_id
  ORDER BY l.created_at ASC
  LIMIT 1
)
WHERE location_id IS NULL
AND account_id IS NOT NULL;

-- Step 2: Delete any agreements that couldn't be migrated (orphaned account-level agreements)
DELETE FROM agreements
WHERE location_id IS NULL;

-- Step 3: Make location_id required (NOT NULL)
ALTER TABLE agreements
ALTER COLUMN location_id SET NOT NULL;

-- Step 4: Add check constraint to ensure location_id is always provided
ALTER TABLE agreements
ADD CONSTRAINT agreements_must_have_location 
CHECK (location_id IS NOT NULL);

-- Step 5: Update indexes for better query performance
-- Ensure we have an index on location_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_agreements_location_id_status 
ON agreements(location_id, status);

-- Step 6: Add comment to document the constraint
COMMENT ON COLUMN agreements.location_id IS 'Required: All agreements must be associated with a location. Contracts are only with locations, never with accounts/networks.';

