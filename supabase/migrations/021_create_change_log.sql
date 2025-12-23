-- Create change_log table to track data tool operations
CREATE TABLE IF NOT EXISTS change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_name TEXT, -- Store user name for easier display
  user_email TEXT, -- Store user email for easier display
  action_type TEXT NOT NULL, -- e.g., 'merge_accounts', 'merge_locations', 'add_location', 'remove_location'
  entity_type TEXT NOT NULL, -- e.g., 'account', 'location'
  entity_id UUID, -- ID of the affected entity
  entity_name TEXT, -- Name of the affected entity for easier display
  description TEXT NOT NULL, -- Human-readable description of the change
  details JSONB, -- Additional details about the change (e.g., merged account IDs, location counts)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_change_log_user_id ON change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_change_log_action_type ON change_log(action_type);
CREATE INDEX IF NOT EXISTS idx_change_log_entity_type ON change_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_change_log_entity_id ON change_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_change_log_created_at ON change_log(created_at DESC);

-- Enable RLS
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: BD team and admins can view all change logs
CREATE POLICY "BD team and admins can view all change logs" ON change_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

-- RLS Policy: Only system can insert change logs (via service role)
-- This will be done via admin client, so we allow inserts from authenticated admin users
CREATE POLICY "BD team and admins can insert change logs" ON change_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('bd_team', 'admin')
    )
  );

COMMENT ON TABLE change_log IS 'Tracks all changes made through data tools for audit purposes';
COMMENT ON COLUMN change_log.action_type IS 'Type of action performed (merge_accounts, merge_locations, add_location, remove_location)';
COMMENT ON COLUMN change_log.entity_type IS 'Type of entity affected (account, location)';
COMMENT ON COLUMN change_log.details IS 'JSON object with additional details about the change';

