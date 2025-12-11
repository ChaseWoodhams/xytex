// Database types matching Supabase schema

export interface Donor {
  id: string;
  name: string;
  age: number;
  ethnicity: string;
  hair_color: string;
  eye_color: string;
  height: string;
  height_inches: number;
  weight: number;
  education: string;
  occupation: string;
  blood_type: string;
  cmv_status: string;
  availability: string;
  is_new: boolean;
  is_popular: boolean;
  is_exclusive: boolean;
  photo_url: string | null;
  interests: string[];
  personality_traits: string[];
  medical_history: string | null;
  genetic_tests: number;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'customer' | 'bd_team' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  subscription_status: 'free_trial' | 'active' | 'expired';
  trial_started_at: string | null;
  trial_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: 'free_trial' | 'active' | 'expired';
  started_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface DonorView {
  id: string;
  user_id: string;
  donor_id: string;
  viewed_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// CRM Types
export type DealStage = 'prospect' | 'qualified' | 'negotiation' | 'closed_won' | 'closed_lost';
export type AccountStatus = 'active' | 'inactive' | 'archived';
export type AccountType = 'single_location' | 'multi_location';
export type LocationStatus = 'active' | 'inactive';
export type AgreementType = 'partnership' | 'vendor' | 'referral' | 'other';
export type AgreementStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'other';

export interface Account {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  // deal_stage removed - column was dropped in migration 004
  annual_revenue: number | null;
  employee_count: number | null;
  status: AccountStatus;
  account_type: AccountType;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  notes: string | null;
  sage_code: string | null;
  udf_clinic_code: string | null;
  udf_clinic_name: string | null;
  udf_shipto_name: string | null;
  udf_address_line1: string | null;
  udf_address_line2: string | null;
  udf_address_line3: string | null;
  udf_city: string | null;
  udf_state: string | null;
  udf_zipcode: string | null;
  udf_fax: string | null;
  udf_notes: string | null;
  udf_phone: string | null;
  udf_email: string | null;
  udf_country_code: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  account_id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  contact_title: string | null;
  is_primary: boolean;
  status: LocationStatus;
  notes: string | null;
  clinic_code: string | null;
  sage_code: string | null;
  agreement_document_url: string | null;
  license_document_url: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactRole = 'primary' | 'billing' | 'clinical' | 'administrative' | 'other';

export interface LocationContact {
  id: string;
  location_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: ContactRole;
  title: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: string;
  account_id: string;
  location_id: string | null;
  agreement_type: AgreementType;
  title: string;
  start_date: string | null;
  end_date: string | null;
  terms: string | null;
  revenue_share_percentage: number | null;
  monthly_fee: number | null;
  status: AgreementStatus;
  document_url: string | null;
  notes: string | null;
  signed_date: string | null;
  signer_name: string | null;
  signer_email: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  account_id: string;
  location_id: string | null;
  activity_type: ActivityType;
  subject: string;
  description: string | null;
  activity_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  account_id: string;
  location_id: string | null;
  title: string | null;
  content: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Database response types (with Supabase metadata)
export interface Database {
  public: {
    Tables: {
      donors: {
        Row: Donor;
        Insert: Omit<Donor, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Donor, 'id' | 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>;
      };
      donor_views: {
        Row: DonorView;
        Insert: Omit<DonorView, 'id' | 'viewed_at'>;
        Update: Partial<Omit<DonorView, 'id' | 'viewed_at'>>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;
      };
      agreements: {
        Row: Agreement;
        Insert: Omit<Agreement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Agreement, 'id' | 'created_at' | 'updated_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

