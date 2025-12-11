-- Add license_document_url field to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS license_document_url TEXT;

COMMENT ON COLUMN locations.license_document_url IS 'URL to the location license document stored in Supabase Storage';

