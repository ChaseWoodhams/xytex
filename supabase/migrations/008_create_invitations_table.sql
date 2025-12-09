-- Create invitations table for team member invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'bd_team',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
-- Admins and BD team can view all invitations
CREATE POLICY "Admins and BD team can view all invitations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
  );

-- Admins and BD team can create invitations
CREATE POLICY "Admins and BD team can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'bd_team')
    )
    AND invited_by = auth.uid()
  );

-- Admins can update invitations
CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Anyone can view their own invitation by token (for acceptance flow)
CREATE POLICY "Anyone can view invitation by token" ON invitations
  FOR SELECT USING (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

