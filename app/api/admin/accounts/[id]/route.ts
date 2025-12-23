import { createClient } from '@/lib/supabase/server';
import {
  getAccountById,
  updateAccount,
  deleteAccount,
} from '@/lib/supabase/accounts';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { logChange, detectFieldChanges, formatChangedFields } from '@/lib/supabase/change-log';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getCurrentUser();
    if (!canAccessAdmin(userProfile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const account = await getAccountById(id);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getCurrentUser();
    if (!canAccessAdmin(userProfile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Get old account data to detect changes
    const oldAccount = await getAccountById(id);
    
    const account = await updateAccount(id, body);

    if (!account) {
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    // Log the change
    const changedFields = detectFieldChanges(oldAccount, body);
    const fieldsDescription = changedFields.length > 0 
      ? formatChangedFields(changedFields)
      : 'account information';
    
    await logChange({
      actionType: 'update_account',
      entityType: 'account',
      entityId: id,
      entityName: account.name,
      description: `Updated ${fieldsDescription} for account "${account.name}"`,
      details: {
        changedFields,
        accountId: id,
        accountName: account.name,
      },
    });

    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getCurrentUser();
    if (!canAccessAdmin(userProfile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get account data before deletion for logging
    const account = await getAccountById(id);
    
    const success = await deleteAccount(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    // Log the change
    if (account) {
      await logChange({
        actionType: 'delete_account',
        entityType: 'account',
        entityId: id,
        entityName: account.name,
        description: `Deleted account "${account.name}"`,
        details: {
          accountId: id,
          accountName: account.name,
          accountType: account.account_type,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    // Return the actual error message for better debugging
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

