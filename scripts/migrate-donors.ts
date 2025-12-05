import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MockDonor {
  id: string;
  name: string;
  age: number;
  ethnicity: string;
  hairColor: string;
  eyeColor: string;
  height: string;
  heightInches: number;
  weight: number;
  education: string;
  occupation: string;
  bloodType: string;
  cmvStatus: string;
  availability: string;
  isNew: boolean;
  isPopular: boolean;
  isExclusive: boolean;
  photoUrl: string;
  interests: string[];
  personalityTraits: string[];
  medicalHistory: string;
  geneticTests: number;
}

function transformDonor(mockDonor: MockDonor) {
  return {
    id: mockDonor.id,
    name: mockDonor.name,
    age: mockDonor.age,
    ethnicity: mockDonor.ethnicity,
    hair_color: mockDonor.hairColor,
    eye_color: mockDonor.eyeColor,
    height: mockDonor.height,
    height_inches: mockDonor.heightInches,
    weight: mockDonor.weight,
    education: mockDonor.education,
    occupation: mockDonor.occupation,
    blood_type: mockDonor.bloodType,
    cmv_status: mockDonor.cmvStatus,
    availability: mockDonor.availability,
    is_new: mockDonor.isNew,
    is_popular: mockDonor.isPopular,
    is_exclusive: mockDonor.isExclusive,
    photo_url: mockDonor.photoUrl,
    interests: mockDonor.interests,
    personality_traits: mockDonor.personalityTraits,
    medical_history: mockDonor.medicalHistory,
    genetic_tests: mockDonor.geneticTests,
  };
}

async function migrateDonors() {
  try {
    // Read the mock donors JSON file
    const jsonPath = path.join(__dirname, '../data/mock-donors.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const { donors } = JSON.parse(jsonData) as { donors: MockDonor[] };

    console.log(`Found ${donors.length} donors to migrate...`);

    // Transform and insert donors
    const transformedDonors = donors.map(transformDonor);

    // Insert in batches to avoid overwhelming the database
    const batchSize = 5;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transformedDonors.length; i += batchSize) {
      const batch = transformedDonors.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('donors')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount += batch.length;
      } else {
        console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} donors)`);
        successCount += batch.length;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated: ${successCount} donors`);
    if (errorCount > 0) {
      console.log(`Errors: ${errorCount} donors`);
    }

    // Verify the migration
    const { count } = await supabase.from('donors').select('*', { count: 'exact', head: true });
    console.log(`Total donors in database: ${count}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDonors();

