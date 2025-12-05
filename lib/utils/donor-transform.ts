import type { Donor as DatabaseDonor } from '@/lib/supabase/types';
import type { Donor } from '@/components/donors/DonorCard';

/**
 * Transform database donor (snake_case) to component donor (camelCase)
 */
export function transformDonor(dbDonor: DatabaseDonor): Donor {
  return {
    id: dbDonor.id,
    name: dbDonor.name,
    age: dbDonor.age,
    ethnicity: dbDonor.ethnicity,
    hairColor: dbDonor.hair_color,
    eyeColor: dbDonor.eye_color,
    height: dbDonor.height,
    heightInches: dbDonor.height_inches,
    weight: dbDonor.weight,
    education: dbDonor.education,
    occupation: dbDonor.occupation,
    bloodType: dbDonor.blood_type,
    cmvStatus: dbDonor.cmv_status,
    availability: dbDonor.availability,
    isNew: dbDonor.is_new,
    isPopular: dbDonor.is_popular,
    isExclusive: dbDonor.is_exclusive,
    photoUrl: dbDonor.photo_url || '/donors/placeholder-1.jpg',
    interests: dbDonor.interests || [],
    personalityTraits: dbDonor.personality_traits || [],
    medicalHistory: dbDonor.medical_history || 'No significant medical history',
    geneticTests: dbDonor.genetic_tests,
  };
}

