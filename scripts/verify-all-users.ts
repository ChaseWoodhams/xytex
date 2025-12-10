import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

/**
 * Script to mark all existing users' emails as verified
 * This is useful when email sending is not working and team needs access
 */
async function verifyAllUsers() {
  console.log('Starting user email verification...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  try {
    // Get all users from auth.users
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      process.exit(1);
    }
    
    if (!users || users.users.length === 0) {
      console.log('No users found to verify.');
      return;
    }
    
    console.log(`Found ${users.users.length} users to verify.`);
    
    // Update each user to mark email as confirmed
    let verifiedCount = 0;
    let skippedCount = 0;
    
    for (const user of users.users) {
      // Skip if already verified
      if (user.email_confirmed_at) {
        console.log(`Skipping ${user.email} - already verified`);
        skippedCount++;
        continue;
      }
      
      try {
        // Update user to mark email as confirmed
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true,
          }
        );
        
        if (updateError) {
          console.error(`Error verifying ${user.email}:`, updateError);
          continue;
        }
        
        console.log(`✓ Verified ${user.email}`);
        verifiedCount++;
      } catch (error: any) {
        console.error(`Error updating user ${user.email}:`, error.message);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total users: ${users.users.length}`);
    console.log(`Verified: ${verifiedCount}`);
    console.log(`Already verified (skipped): ${skippedCount}`);
    console.log('Done!');
    
  } catch (error: any) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
verifyAllUsers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

