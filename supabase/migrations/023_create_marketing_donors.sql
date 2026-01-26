-- Create marketing_donors table to store comprehensive donor information for marketing/internal use
CREATE TABLE IF NOT EXISTS marketing_donors (
  -- Core Identification
  id TEXT PRIMARY KEY,
  name TEXT,
  year_of_birth INTEGER,
  marital_status TEXT,
  number_of_children INTEGER DEFAULT 0,

  -- Demographics
  occupation TEXT,
  education TEXT,
  blood_type TEXT,
  nationality_maternal TEXT,
  nationality_paternal TEXT,
  race TEXT,
  cmv_status TEXT,

  -- Physical Attributes
  height_feet_inches TEXT,
  height_cm NUMERIC,
  weight_lbs INTEGER,
  weight_kg NUMERIC,
  eye_color TEXT,
  hair_color TEXT,
  hair_texture TEXT,
  hair_loss TEXT,
  hair_type TEXT,
  body_build TEXT,
  freckles TEXT,
  skin_tone TEXT,

  -- Genetic Testing
  genetic_tests_count INTEGER,
  genetic_test_results JSONB DEFAULT '{}',
  last_medical_history_update DATE,

  -- Health Information
  health_info JSONB DEFAULT '{}',
  health_comments TEXT,

  -- Personality & Interests
  skills_hobbies_interests TEXT,
  personality_description TEXT,

  -- Education Details
  education_details JSONB DEFAULT '{}',

  -- Family Medical History
  immediate_family_history JSONB DEFAULT '{}',
  paternal_family_history JSONB DEFAULT '{}',
  maternal_family_history JSONB DEFAULT '{}',
  health_diseases JSONB DEFAULT '{}',

  -- Purchase Options
  vial_options JSONB DEFAULT '[]',
  compliance_flags JSONB DEFAULT '{}',
  audio_file_available BOOLEAN DEFAULT FALSE,
  photos_available BOOLEAN DEFAULT FALSE,
  inventory_summary TEXT,

  -- Metadata
  profile_current_date TIMESTAMP WITH TIME ZONE,
  document_id TEXT,
  source_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketing_donors_name ON marketing_donors(name);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_year_of_birth ON marketing_donors(year_of_birth);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_race ON marketing_donors(race);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_cmv_status ON marketing_donors(cmv_status);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_created_by ON marketing_donors(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_created_at ON marketing_donors(created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_marketing_donors_genetic_test_results ON marketing_donors USING GIN (genetic_test_results);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_vial_options ON marketing_donors USING GIN (vial_options);
CREATE INDEX IF NOT EXISTS idx_marketing_donors_health_info ON marketing_donors USING GIN (health_info);

-- Enable Row Level Security
ALTER TABLE marketing_donors ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin and BD team can view and manage marketing donors
CREATE POLICY "Admin and BD team can view marketing donors" ON marketing_donors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can insert marketing donors" ON marketing_donors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Admin and BD team can update marketing donors" ON marketing_donors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

CREATE POLICY "Admin and BD team can delete marketing donors" ON marketing_donors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_marketing_donors_updated_at BEFORE UPDATE ON marketing_donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE marketing_donors IS 'Comprehensive donor information for marketing and internal use, separate from public donors table';
