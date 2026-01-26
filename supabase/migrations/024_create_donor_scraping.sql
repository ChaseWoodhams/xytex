-- Create enum types for scraping
CREATE TYPE scraping_status_enum AS ENUM ('pending', 'success', 'failed', 'skipped');
CREATE TYPE scraping_job_type_enum AS ENUM ('full', 'incremental');
CREATE TYPE scraping_job_status_enum AS ENUM ('pending', 'running', 'completed', 'failed');

-- Create scraping_credentials table for storing Xytex login credentials
CREATE TABLE IF NOT EXISTS scraping_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xytex_email TEXT NOT NULL,
  xytex_password TEXT NOT NULL, -- Should be encrypted at application level
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donor_id_list table to manage which donors to scrape
CREATE TABLE IF NOT EXISTS donor_id_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  last_successful_scrape_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scraping_jobs table to track scraping job execution
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type scraping_job_type_enum NOT NULL,
  status scraping_job_status_enum DEFAULT 'pending',
  total_donors INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scraping_results table to store individual scrape results
CREATE TABLE IF NOT EXISTS scraping_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scraping_jobs(id) ON DELETE SET NULL,
  donor_id TEXT NOT NULL,
  scrape_status scraping_status_enum NOT NULL DEFAULT 'pending',
  banner_message TEXT,
  scraped_data JSONB DEFAULT '{}',
  error_message TEXT,
  profile_current_date TIMESTAMP WITH TIME ZONE,
  document_id TEXT,
  changes_detected JSONB DEFAULT '{}',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scraping_credentials_is_active ON scraping_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_donor_id_list_donor_id ON donor_id_list(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_id_list_is_active ON donor_id_list(is_active);
CREATE INDEX IF NOT EXISTS idx_donor_id_list_last_scraped_at ON donor_id_list(last_scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_started_at ON scraping_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_by ON scraping_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_scraping_results_job_id ON scraping_results(job_id);
CREATE INDEX IF NOT EXISTS idx_scraping_results_donor_id ON scraping_results(donor_id);
CREATE INDEX IF NOT EXISTS idx_scraping_results_scraped_at ON scraping_results(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_results_scrape_status ON scraping_results(scrape_status);
CREATE INDEX IF NOT EXISTS idx_scraping_results_donor_scraped ON scraping_results(donor_id, scraped_at DESC);

-- GIN index for JSONB columns
CREATE INDEX IF NOT EXISTS idx_scraping_results_scraped_data ON scraping_results USING GIN (scraped_data);
CREATE INDEX IF NOT EXISTS idx_scraping_results_changes_detected ON scraping_results USING GIN (changes_detected);

-- Enable Row Level Security
ALTER TABLE scraping_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_id_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scraping_credentials
CREATE POLICY "Admin and BD team can view scraping credentials" ON scraping_credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage scraping credentials" ON scraping_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- RLS Policies for donor_id_list
CREATE POLICY "Admin and BD team can view donor id list" ON donor_id_list
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage donor id list" ON donor_id_list
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- RLS Policies for scraping_jobs
CREATE POLICY "Admin and BD team can view scraping jobs" ON scraping_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage scraping jobs" ON scraping_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- RLS Policies for scraping_results
CREATE POLICY "Admin and BD team can view scraping results" ON scraping_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can manage scraping results" ON scraping_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_scraping_credentials_updated_at BEFORE UPDATE ON scraping_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_jobs_updated_at BEFORE UPDATE ON scraping_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE scraping_credentials IS 'Stores Xytex login credentials for automated scraping (should be encrypted at application level)';
COMMENT ON TABLE donor_id_list IS 'List of donor IDs to scrape, tracks scraping history per donor';
COMMENT ON TABLE scraping_jobs IS 'Tracks scraping job execution and progress';
COMMENT ON TABLE scraping_results IS 'Individual scrape results with full data and change tracking';
