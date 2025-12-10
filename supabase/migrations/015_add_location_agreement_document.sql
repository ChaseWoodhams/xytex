-- Migration: Add agreement_document_url to locations table
-- This allows each location to have a location-level agreement document

-- Add agreement_document_url column to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS agreement_document_url TEXT;

-- Add comment to document the purpose of this field
COMMENT ON COLUMN locations.agreement_document_url IS 'URL to the location-level agreement document (e.g., master agreement, location-specific contract)';

