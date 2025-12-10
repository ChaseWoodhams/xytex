-- Add signer metadata fields to agreements table
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS signed_date DATE,
ADD COLUMN IF NOT EXISTS signer_name TEXT,
ADD COLUMN IF NOT EXISTS signer_email TEXT;

COMMENT ON COLUMN agreements.signed_date IS 'Date the agreement was signed';
COMMENT ON COLUMN agreements.signer_name IS 'Name of the person who signed the agreement';
COMMENT ON COLUMN agreements.signer_email IS 'Email address of the signer';

