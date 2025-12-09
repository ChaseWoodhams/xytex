import { createAdminClient } from './admin';
import type { Invitation, UserRole } from './types';
import { randomBytes } from 'crypto';

export async function createInvitation(
  email: string,
  role: UserRole,
  invitedBy: string,
  expiresInDays: number = 7
): Promise<Invitation | null> {
  const supabase = createAdminClient();
  
  // Check if user with this email already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  // Check if there's already a pending invitation for this email
  const { data: existingInvitation } = await supabase
    .from('invitations')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (existingInvitation) {
    throw new Error('A pending invitation already exists for this email');
  }

  // Generate a unique token
  const token = randomBytes(32).toString('hex');
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('invitations') as any)
    .insert({
      email,
      role,
      invited_by: invitedBy,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invitation:', error);
    return null;
  }

  return data;
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const supabase = createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('invitations') as any)
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    console.error('Error fetching invitation:', error);
    return null;
  }

  // Check if invitation is expired
  if (data && new Date(data.expires_at) < new Date() && data.status === 'pending') {
    // Mark as expired
    await updateInvitationStatus(data.id, 'expired');
    return null;
  }

  return data;
}

export async function getInvitationsByInviter(inviterId: string): Promise<Invitation[]> {
  const supabase = createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('invitations') as any)
    .select('*')
    .eq('invited_by', inviterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }

  return data || [];
}

export async function getAllInvitations(): Promise<Invitation[]> {
  try {
    const supabase = createAdminClient();
    
    // Test admin client connection with a simple query
    // This verifies the service role key is working and can bypass RLS
    const testQuery = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testQuery.error) {
      console.error('Admin client connection test failed:', {
        message: testQuery.error.message,
        code: testQuery.error.code,
        details: testQuery.error.details,
        hint: testQuery.error.hint
      });
      
      // If test fails, likely an environment or permission issue
      if (testQuery.error.code === 'PGRST301' || testQuery.error.message?.includes('JWT')) {
        console.error('Service role key may be invalid or missing. Check SUPABASE_SERVICE_ROLE_KEY environment variable.');
      }
      
      return [];
    }
    
    console.log('Admin client connection verified successfully');
    
    // Use RPC or direct query if needed, but service role should bypass RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('invitations') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Log detailed error information
      const errorDetails = {
        message: error.message || 'Unknown error',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        code: error.code || 'No code',
        errorObject: error,
        errorString: String(error),
        errorJSON: JSON.stringify(error, null, 2)
      };
      
      console.error('Error fetching invitations:', errorDetails);
      
      // If it's a permission error, log that specifically
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('RLS policy may be blocking access even with service role key');
      }
      
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Exception in getAllInvitations:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      error: err,
      errorString: String(err)
    });
    return [];
  }
}

export async function updateInvitationStatus(
  id: string,
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
): Promise<boolean> {
  const supabase = createAdminClient();
  
  const updateData: any = { status };
  if (status === 'accepted') {
    updateData.accepted_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('invitations') as any)
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating invitation status:', error);
    return false;
  }

  return true;
}

export async function cancelInvitation(id: string): Promise<boolean> {
  return updateInvitationStatus(id, 'cancelled');
}

export async function acceptInvitation(token: string): Promise<Invitation | null> {
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    throw new Error('Invitation not found or expired');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation has already been ${invitation.status}`);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await updateInvitationStatus(invitation.id, 'expired');
    throw new Error('Invitation has expired');
  }

  // Mark invitation as accepted
  await updateInvitationStatus(invitation.id, 'accepted');
  
  return invitation;
}

