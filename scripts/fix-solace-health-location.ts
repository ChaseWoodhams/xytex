import { createAdminClient } from '../lib/supabase/admin';
import { getAccountById, getAccounts } from '../lib/supabase/accounts';
import { getLocationsByAccount, createLocation } from '../lib/supabase/locations';

async function fixSolaceHealthLocation() {
  console.log('🔍 Searching for Solace Health account...');
  
  const supabase = createAdminClient();
  
  // Search for Solace Health account
  const { data: accounts, error: searchError } = await supabase
    .from('accounts')
    .select('*')
    .ilike('name', '%Solace Health%');
  
  if (searchError) {
    console.error('Error searching for account:', searchError);
    process.exit(1);
  }
  
  if (!accounts || accounts.length === 0) {
    console.error('❌ Solace Health account not found');
    process.exit(1);
  }
  
  const account = accounts[0];
  console.log(`✅ Found account: ${account.name} (ID: ${account.id})`);
  console.log(`   Account Type: ${account.account_type || 'not set'}`);
  
  // Check if account type is set correctly
  if (account.account_type !== 'single_location') {
    console.log(`⚠️  Account type is "${account.account_type}", updating to "single_location"...`);
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ account_type: 'single_location' })
      .eq('id', account.id);
    
    if (updateError) {
      console.error('Error updating account type:', updateError);
      process.exit(1);
    }
    console.log('✅ Account type updated to single_location');
    account.account_type = 'single_location';
  }
  
  // Check existing locations
  const existingLocations = await getLocationsByAccount(account.id);
  console.log(`📍 Existing locations: ${existingLocations.length}`);
  
  if (existingLocations.length > 0) {
    console.log('✅ Location already exists:');
    existingLocations.forEach((loc, idx) => {
      console.log(`   ${idx + 1}. ${loc.name} (ID: ${loc.id})`);
      console.log(`      Address: ${loc.address_line1 || 'N/A'}, ${loc.city || 'N/A'}, ${loc.state || 'N/A'}`);
      console.log(`      Primary: ${loc.is_primary ? 'Yes' : 'No'}`);
    });
    console.log('✅ No action needed - location already exists');
    process.exit(0);
  }
  
  // Create location based on account data
  console.log('🔨 Creating location from account data...');
  
  // Normalize country code
  let countryCode = account.udf_country_code || 'US';
  if (countryCode.toUpperCase() === 'USA' || countryCode.toUpperCase() === 'UNITED STATES') {
    countryCode = 'US';
  }
  
  const locationData = {
    account_id: account.id,
    name: account.name,
    address_line1: account.udf_address_line1 || null,
    address_line2: account.udf_address_line2 || null,
    city: account.udf_city || null,
    state: account.udf_state || null,
    zip_code: account.udf_zipcode || null,
    country: countryCode,
    phone: account.primary_contact_phone || null,
    email: account.primary_contact_email || null,
    contact_name: account.primary_contact_name || null,
    contact_title: null,
    is_primary: true,
    status: 'active' as const,
    notes: account.notes || null,
    sage_code: null,
    agreement_document_url: null,
  };
  
  console.log('📍 Location data to create:');
  console.log(JSON.stringify(locationData, null, 2));
  
  const location = await createLocation(locationData);
  
  if (!location) {
    console.error('❌ Failed to create location');
    process.exit(1);
  }
  
  console.log('✅ Location created successfully!');
  console.log(`   Location ID: ${location.id}`);
  console.log(`   Location Name: ${location.name}`);
  console.log(`   Clinic Code: ${location.clinic_code || 'N/A'}`);
  console.log(`   Address: ${location.address_line1 || 'N/A'}, ${location.city || 'N/A'}, ${location.state || 'N/A'} ${location.zip_code || ''}`);
  console.log(`   Country: ${location.country}`);
  console.log(`   Phone: ${location.phone || 'N/A'}`);
  console.log(`   Email: ${location.email || 'N/A'}`);
  console.log(`   Primary: ${location.is_primary ? 'Yes' : 'No'}`);
  console.log(`   Status: ${location.status}`);
}

fixSolaceHealthLocation()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

