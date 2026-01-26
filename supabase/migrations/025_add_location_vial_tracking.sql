-- Add total_vials_sold column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS total_vials_sold INTEGER DEFAULT 0 NOT NULL;

-- Create location_vial_sales table to track individual vial additions
CREATE TABLE IF NOT EXISTS location_vial_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  vials_added INTEGER NOT NULL CHECK (vials_added > 0),
  entered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_location_vial_sales_location_id ON location_vial_sales(location_id);
CREATE INDEX IF NOT EXISTS idx_location_vial_sales_entered_at ON location_vial_sales(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_vial_sales_entered_by ON location_vial_sales(entered_by);
CREATE INDEX IF NOT EXISTS idx_locations_total_vials_sold ON locations(total_vials_sold);

-- Enable Row Level Security
ALTER TABLE location_vial_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_vial_sales
CREATE POLICY "BD team and admins can view location vial sales" ON location_vial_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can insert location vial sales" ON location_vial_sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can update location vial sales" ON location_vial_sales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can delete location vial sales" ON location_vial_sales
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

COMMENT ON TABLE location_vial_sales IS 'Tracks individual vial sales entries for each location with timestamp and user who entered it';
COMMENT ON COLUMN locations.total_vials_sold IS 'Total cumulative vials sold for this location';
