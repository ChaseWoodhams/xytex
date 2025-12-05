-- Create enum types
CREATE TYPE subscription_status_enum AS ENUM ('free_trial', 'active', 'expired');

-- Create donors table
CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  ethnicity TEXT NOT NULL,
  hair_color TEXT NOT NULL,
  eye_color TEXT NOT NULL,
  height TEXT NOT NULL,
  height_inches INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  education TEXT NOT NULL,
  occupation TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  cmv_status TEXT NOT NULL,
  availability TEXT NOT NULL,
  is_new BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  interests TEXT[] DEFAULT '{}',
  personality_traits TEXT[] DEFAULT '{}',
  medical_history TEXT,
  genetic_tests INTEGER DEFAULT 569,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  subscription_status subscription_status_enum DEFAULT 'free_trial',
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status subscription_status_enum NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donor_views table for analytics
CREATE TABLE IF NOT EXISTS donor_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donor_id TEXT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donors_ethnicity ON donors(ethnicity);
CREATE INDEX IF NOT EXISTS idx_donors_cmv_status ON donors(cmv_status);
CREATE INDEX IF NOT EXISTS idx_donors_availability ON donors(availability);
CREATE INDEX IF NOT EXISTS idx_donors_is_new ON donors(is_new);
CREATE INDEX IF NOT EXISTS idx_donors_is_popular ON donors(is_popular);
CREATE INDEX IF NOT EXISTS idx_donors_is_exclusive ON donors(is_exclusive);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_donor_views_user_id ON donor_views(user_id);
CREATE INDEX IF NOT EXISTS idx_donor_views_donor_id ON donor_views(donor_id);

-- Enable Row Level Security
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donors (public read access)
CREATE POLICY "Donors are viewable by everyone" ON donors
  FOR SELECT USING (true);

-- RLS Policies for users (users can only read/update their own data)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for subscriptions (users can only read their own)
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for donor_views (users can only insert their own views)
CREATE POLICY "Users can insert own donor views" ON donor_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own donor views" ON donor_views
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has active trial
CREATE OR REPLACE FUNCTION check_trial_status(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT trial_expires_at INTO trial_expires
  FROM users
  WHERE id = user_uuid;
  
  IF trial_expires IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN trial_expires > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a 7-day free trial
CREATE OR REPLACE FUNCTION start_trial(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET 
    subscription_status = 'free_trial',
    trial_started_at = NOW(),
    trial_expires_at = NOW() + INTERVAL '7 days',
    updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Insert subscription record
  INSERT INTO subscriptions (user_id, status, started_at, expires_at)
  VALUES (user_uuid, 'free_trial', NOW(), NOW() + INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

