# Supabase Setup Instructions

## Prerequisites
- Supabase account (https://supabase.com)
- Vercel account (https://vercel.com)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your project URL and anon key from Settings > API
3. Get your service role key from Settings > API (keep this secret!)

## Step 2: Run Database Migration

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL in the Supabase SQL Editor
5. Verify tables were created: donors, users, subscriptions, donor_views

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 4: Migrate Donor Data

Run the migration script to populate your database:

```bash
npm run migrate
```

This will import all 12 mock donors from `data/mock-donors.json` into Supabase.

## Step 5: Configure Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

## Step 6: Test Authentication

1. Visit your deployed site
2. Click "Start Free Trial" to create an account
3. Verify you can browse donors
4. Check your Supabase dashboard to see the user was created

## Troubleshooting

### "Failed to fetch" Error

If you see a "Failed to fetch" error when trying to sign up or log in:

1. **Check Environment Variables**:
   - Verify `.env.local` exists in the project root
   - Ensure variables start with `NEXT_PUBLIC_` (required for client-side access)
   - Restart your development server after adding/changing environment variables
   - Check the browser console for specific error messages

2. **Verify Supabase URL Format**:
   - Should be: `https://your-project-id.supabase.co`
   - Must start with `https://` (not `http://`)
   - No trailing slash

3. **Check Supabase Project Status**:
   - Go to your Supabase dashboard
   - Ensure your project is not paused
   - Free tier projects may pause after inactivity

4. **Network Issues**:
   - Check your internet connection
   - Try accessing your Supabase project URL directly in a browser
   - Check if a firewall or VPN is blocking the connection

5. **CORS Issues**:
   - In Supabase dashboard, go to Settings > API
   - Add your local URL (`http://localhost:3000`) to allowed origins
   - For production, add your domain to allowed origins

### Other Common Issues

- **Migration fails**: Make sure you've run the SQL migration first
- **Auth not working**: Check that environment variables are set correctly and server is restarted
- **Donors not loading**: Verify RLS policies are enabled and donors table has data
- **Email confirmation not working**: Check redirect URLs in Supabase Auth settings

