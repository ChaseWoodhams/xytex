-- Create care_package_requests table to track BD-created care package requests
CREATE TABLE IF NOT EXISTS care_package_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  priority TEXT, -- e.g., 'normal', 'rush'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create care_package_shipments table for individual shipment line items
CREATE TABLE IF NOT EXISTS care_package_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES care_package_requests(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  label TEXT, -- e.g., 'Clinic office', 'Dr. Smith home'
  recipient_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'requested', -- requested | in_progress | sent | cancelled
  sent_at TIMESTAMP WITH TIME ZONE,
  materials_cost NUMERIC(10,2),
  shipping_cost NUMERIC(10,2),
  -- Store total_cost explicitly for easier querying; keep logic in application
  total_cost NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_care_package_requests_account_id ON care_package_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_care_package_requests_location_id ON care_package_requests(location_id);
CREATE INDEX IF NOT EXISTS idx_care_package_requests_requested_at ON care_package_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_care_package_shipments_request_id ON care_package_shipments(request_id);
CREATE INDEX IF NOT EXISTS idx_care_package_shipments_account_id ON care_package_shipments(account_id);
CREATE INDEX IF NOT EXISTS idx_care_package_shipments_location_id ON care_package_shipments(location_id);
CREATE INDEX IF NOT EXISTS idx_care_package_shipments_status ON care_package_shipments(status);
CREATE INDEX IF NOT EXISTS idx_care_package_shipments_created_at ON care_package_shipments(created_at DESC);

-- Enable RLS
ALTER TABLE care_package_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_package_shipments ENABLE ROW LEVEL SECURITY;

-- RLS: BD team and admins can view and manage care package data
CREATE POLICY "BD team and admins can view care package requests" ON care_package_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can insert care package requests" ON care_package_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can update care package requests" ON care_package_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can view care package shipments" ON care_package_shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can insert care package shipments" ON care_package_shipments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

CREATE POLICY "BD team and admins can update care package shipments" ON care_package_shipments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

COMMENT ON TABLE care_package_requests IS 'High-level care package requests created by BD team for clinic locations or custom addresses';
COMMENT ON TABLE care_package_shipments IS 'Individual care package shipment line items with addresses, status, and costs';

