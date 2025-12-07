# Business Development CRM Setup Guide

## Overview
The Business Development CRM has been successfully implemented with database schema, API routes, and UI components. This guide covers the remaining manual setup steps.

## Completed

✅ Database schema migration applied
✅ All CRM tables created (corporate_accounts, locations, agreements, activities, notes)
✅ User role system implemented
✅ RLS policies configured
✅ TypeScript types updated
✅ Helper functions created
✅ API routes implemented
✅ Admin UI components created
✅ Role-based access control implemented

## Manual Setup Required

### 1. Create Supabase Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New bucket**
4. Name: `agreements`
5. Set as **Public bucket** (or configure policies as needed)
6. Click **Create bucket**

### 2. Configure Storage Bucket Policies

After creating the bucket, set up policies:

```sql
-- Allow authenticated users with bd_team or admin role to upload
CREATE POLICY "BD team and admins can upload agreements"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agreements' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('bd_team', 'admin')
  )
);

-- Allow authenticated users with bd_team or admin role to read
CREATE POLICY "BD team and admins can read agreements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agreements' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('bd_team', 'admin')
  )
);

-- Allow authenticated users with bd_team or admin role to delete
CREATE POLICY "BD team and admins can delete agreements"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agreements' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('bd_team', 'admin')
  )
);
```

### 3. Assign Admin/BD Team Roles to Users

To grant admin access to users, update their role in the database:

```sql
-- Make a user an admin
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Make a user BD team member
UPDATE users
SET role = 'bd_team'
WHERE email = 'bd@example.com';
```

Or use the Supabase dashboard:
1. Go to **Authentication** → **Users**
2. Find the user
3. Update the `role` field in the `users` table via SQL Editor or Table Editor

## Accessing the Admin CRM

1. Log in with a user that has `admin` or `bd_team` role
2. Navigate to `/admin` or click "Admin CRM" in the user menu
3. You'll see the dashboard with account management

## Features Implemented

### Dashboard (`/admin`)
- Overview statistics
- Recent accounts list
- Quick actions

### Accounts Management (`/admin/accounts`)
- List all corporate accounts
- Search and filter by status, deal stage, industry
- Create new accounts
- View account details

### Account Detail (`/admin/accounts/[id]`)
- Overview tab: Account information and primary contact
- Locations tab: Manage account locations
- Agreements tab: View and manage partner agreements
- Activities tab: Activity timeline
- Notes tab: Account notes (with private note support)

### API Endpoints

All endpoints are protected and require `bd_team` or `admin` role:

- `GET /api/admin/accounts` - List accounts
- `POST /api/admin/accounts` - Create account
- `GET /api/admin/accounts/[id]` - Get account
- `PATCH /api/admin/accounts/[id]` - Update account
- `DELETE /api/admin/accounts/[id]` - Delete account
- `POST /api/admin/locations` - Create location
- `PATCH /api/admin/locations/[id]` - Update location
- `DELETE /api/admin/locations/[id]` - Delete location
- `POST /api/admin/agreements` - Create agreement
- `PATCH /api/admin/agreements/[id]` - Update agreement
- `DELETE /api/admin/agreements/[id]` - Delete agreement
- `POST /api/admin/agreements/[id]/upload` - Upload agreement document
- `POST /api/admin/activities` - Create activity
- `PATCH /api/admin/activities/[id]` - Update activity
- `DELETE /api/admin/activities/[id]` - Delete activity
- `POST /api/admin/notes` - Create note
- `PATCH /api/admin/notes/[id]` - Update note
- `DELETE /api/admin/notes/[id]` - Delete note

## Next Steps (Future Enhancements)

The following features have placeholder UI but need form implementations:

1. **Location Forms** - Create/edit location forms
2. **Agreement Forms** - Create/edit agreement forms with file upload
3. **Activity Forms** - Log activities form
4. **Note Forms** - Create/edit notes form
5. **Account Edit** - Edit account form (currently only create is implemented)

## Testing

1. Assign yourself an admin role:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

2. Log in and navigate to `/admin`

3. Create a test account to verify the system works

## Notes

- All admin routes are protected by middleware
- RLS policies ensure only authorized users can access data
- File uploads require the `agreements` storage bucket to be created
- The role column defaults to `'customer'` for new users
