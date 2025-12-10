-- Create location_contacts table for multiple contacts per location
CREATE TABLE IF NOT EXISTS location_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL, -- e.g., 'primary', 'billing', 'clinical', 'administrative', 'other'
  title TEXT, -- Job title
  is_primary BOOLEAN DEFAULT false, -- Primary contact for this location
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_contacts_location_id ON location_contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_location_contacts_role ON location_contacts(role);

-- Add comments
COMMENT ON TABLE location_contacts IS 'Multiple contacts with various roles for clinic locations';
COMMENT ON COLUMN location_contacts.role IS 'Contact role: primary, billing, clinical, administrative, or other';
COMMENT ON COLUMN location_contacts.is_primary IS 'Indicates if this is the primary contact for the location';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_location_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_contacts_updated_at
  BEFORE UPDATE ON location_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_location_contacts_updated_at();

-- Enable RLS
ALTER TABLE location_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth requirements)
-- Allow authenticated users to read location contacts
CREATE POLICY "Users can view location contacts"
  ON location_contacts
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert location contacts
CREATE POLICY "Users can insert location contacts"
  ON location_contacts
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update location contacts
CREATE POLICY "Users can update location contacts"
  ON location_contacts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete location contacts
CREATE POLICY "Users can delete location contacts"
  ON location_contacts
  FOR DELETE
  USING (true);

