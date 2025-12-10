-- Add clinic_code and sage_code fields to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS clinic_code TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS sage_code TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_clinic_code ON locations(clinic_code);
CREATE INDEX IF NOT EXISTS idx_locations_sage_code ON locations(sage_code);

