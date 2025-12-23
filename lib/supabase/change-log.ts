import { createAdminClient } from './admin';
import { getCurrentUser } from './users';

export type ChangeLogActionType = 
  | 'merge_accounts' 
  | 'merge_locations' 
  | 'add_location' 
  | 'remove_location'
  | 'create_account'
  | 'update_account'
  | 'delete_account'
  | 'create_location'
  | 'update_location'
  | 'delete_location'
  | 'create_agreement'
  | 'update_agreement'
  | 'delete_agreement'
  | 'upload_contract'
  | 'upload_license';

export type ChangeLogEntityType = 'account' | 'location' | 'agreement';

export interface ChangeLogDetails {
  [key: string]: any;
}

export interface CreateChangeLogParams {
  actionType: ChangeLogActionType;
  entityType: ChangeLogEntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  details?: ChangeLogDetails;
}

/**
 * Logs a change to the change_log table
 * This should be called from API routes after performing data tool operations
 */
export async function logChange(params: CreateChangeLogParams): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('Cannot log change: No authenticated user');
      return;
    }

    const adminClient = createAdminClient();

    const changeLogData = {
      user_id: user.id,
      user_name: user.full_name || null,
      user_email: user.email,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      description: params.description,
      details: params.details || null,
    };

    const { error } = await adminClient
      .from('change_log')
      .insert(changeLogData);

    if (error) {
      console.error('Error logging change:', error);
      // Don't throw - we don't want to fail the main operation if logging fails
    }
  } catch (error) {
    console.error('Exception in logChange:', error);
    // Don't throw - we don't want to fail the main operation if logging fails
  }
}

/**
 * Detects which fields changed between old and new objects
 */
export function detectFieldChanges<T extends Record<string, any>>(
  oldData: T | null,
  newData: Partial<T>
): string[] {
  if (!oldData) {
    // If no old data, all provided fields are new
    return Object.keys(newData).filter(key => newData[key] !== undefined && newData[key] !== null);
  }

  const changedFields: string[] = [];
  
  for (const key in newData) {
    if (newData[key] !== undefined && newData[key] !== null) {
      const oldValue = oldData[key];
      const newValue = newData[key];
      
      // Compare values (handle dates, arrays, etc.)
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(key);
      }
    }
  }
  
  return changedFields;
}

/**
 * Formats a list of changed fields into a readable description
 */
export function formatChangedFields(fields: string[]): string {
  if (fields.length === 0) return '';
  if (fields.length === 1) return fields[0];
  if (fields.length <= 3) return fields.join(', ');
  return `${fields.slice(0, 3).join(', ')} and ${fields.length - 3} more`;
}

/**
 * Fetches change logs with optional filtering
 */
export async function getChangeLogs(options?: {
  limit?: number;
  actionType?: ChangeLogActionType;
  entityType?: ChangeLogEntityType;
  entityId?: string;
}) {
  try {
    const adminClient = createAdminClient();

    let query = adminClient
      .from('change_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.actionType) {
      query = query.eq('action_type', options.actionType);
    }

    if (options?.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    if (options?.entityId) {
      query = query.eq('entity_id', options.entityId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching change logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getChangeLogs:', error);
    return [];
  }
}

