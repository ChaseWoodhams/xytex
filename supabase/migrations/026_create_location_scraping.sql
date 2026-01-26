-- Create enum types for location scraping
CREATE TYPE location_scraping_source_enum AS ENUM ('google_maps', 'linkedin', 'website', 'all');
CREATE TYPE location_scraping_job_status_enum AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE location_scraping_credential_service_enum AS ENUM ('google_maps', 'linkedin', 'serpapi', 'scraperapi');

-- Create location_scraping_jobs table to track scraping job execution
CREATE TABLE IF NOT EXISTS location_scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  source location_scraping_source_enum NOT NULL DEFAULT 'all',
  status location_scraping_job_status_enum DEFAULT 'pending',
  results_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create location_scraping_results table to store individual scrape results
CREATE TABLE IF NOT EXISTS location_scraping_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES location_scraping_jobs(id) ON DELETE SET NULL,
  source location_scraping_source_enum NOT NULL,
  business_name TEXT,
  google_place_id TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  employees JSONB DEFAULT '[]',
  business_hours JSONB DEFAULT '{}',
  rating NUMERIC,
  review_count INTEGER,
  categories TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  scraped_data JSONB DEFAULT '{}',
  matched_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  matched_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create location_scraping_credentials table for storing API keys/credentials
CREATE TABLE IF NOT EXISTS location_scraping_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service location_scraping_credential_service_enum NOT NULL,
  api_key TEXT NOT NULL, -- Should be encrypted at application level
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service, is_active) -- Only one active credential per service
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_location_scraping_jobs_status ON location_scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_location_scraping_jobs_created_at ON location_scraping_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_scraping_jobs_created_by ON location_scraping_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_job_id ON location_scraping_results(job_id);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_source ON location_scraping_results(source);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_scraped_at ON location_scraping_results(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_matched_location ON location_scraping_results(matched_location_id);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_matched_account ON location_scraping_results(matched_account_id);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_business_name ON location_scraping_results(business_name);
CREATE INDEX IF NOT EXISTS idx_location_scraping_credentials_service ON location_scraping_credentials(service);
CREATE INDEX IF NOT EXISTS idx_location_scraping_credentials_is_active ON location_scraping_credentials(is_active);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_employees ON location_scraping_results USING GIN (employees);
CREATE INDEX IF NOT EXISTS idx_location_scraping_results_scraped_data ON location_scraping_results USING GIN (scraped_data);

-- Enable Row Level Security
ALTER TABLE location_scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_scraping_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_scraping_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_scraping_jobs
CREATE POLICY "Admin and BD team can view location scraping jobs" ON location_scraping_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage location scraping jobs" ON location_scraping_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- RLS Policies for location_scraping_results
CREATE POLICY "Admin and BD team can view location scraping results" ON location_scraping_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage location scraping results" ON location_scraping_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- RLS Policies for location_scraping_credentials
CREATE POLICY "Admin and BD team can view location scraping credentials" ON location_scraping_credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage location scraping credentials" ON location_scraping_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- Create triggers for updated_at timestamp
CREATE TRIGGER update_location_scraping_jobs_updated_at BEFORE UPDATE ON location_scraping_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_scraping_credentials_updated_at BEFORE UPDATE ON location_scraping_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE location_scraping_jobs IS 'Tracks location scraping job execution and progress';
COMMENT ON TABLE location_scraping_results IS 'Individual location scrape results with full data and matching information';
COMMENT ON TABLE location_scraping_credentials IS 'Stores API keys and credentials for location scraping services (should be encrypted at application level)';
