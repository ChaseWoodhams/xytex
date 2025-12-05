import { getFeaturedDonors } from "@/lib/supabase/donors";
import { transformDonor } from "@/lib/utils/donor-transform";
import FeaturedDonorsClient from "./FeaturedDonorsClient";

// Legacy mock data - kept as fallback during migration
const mockFeaturedDonors = [
  {
    id: "XY-7842",
    name: "Marcus",
    age: 28,
    ethnicity: "Caucasian",
    hairColor: "Brown",
    eyeColor: "Blue",
    height: '6\'1"',
    heightInches: 73,
    weight: 185,
    education: "Master's in Engineering",
    occupation: "Software Engineer",
    bloodType: "O+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: true,
    isPopular: false,
    isExclusive: false,
    photoUrl: "/donors/placeholder-1.jpg",
    interests: ["Rock Climbing", "Photography", "Chess"],
    personalityTraits: ["Analytical", "Creative", "Adventurous"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-5291",
    name: "David",
    age: 32,
    ethnicity: "Hispanic/Latino",
    hairColor: "Black",
    eyeColor: "Brown",
    height: '5\'10"',
    heightInches: 70,
    weight: 175,
    education: "MBA in Finance",
    occupation: "Financial Analyst",
    bloodType: "A+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: true,
    isExclusive: false,
    photoUrl: "/donors/placeholder-2.jpg",
    interests: ["Soccer", "Cooking", "Music Production"],
    personalityTraits: ["Charismatic", "Organized", "Empathetic"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-3167",
    name: "James",
    age: 26,
    ethnicity: "African American",
    hairColor: "Black",
    eyeColor: "Brown",
    height: '6\'3"',
    heightInches: 75,
    weight: 195,
    education: "Bachelor's in Biology",
    occupation: "Research Scientist",
    bloodType: "B+",
    cmvStatus: "Positive",
    availability: "Available",
    isNew: false,
    isPopular: true,
    isExclusive: true,
    photoUrl: "/donors/placeholder-3.jpg",
    interests: ["Basketball", "Reading", "Volunteering"],
    personalityTraits: ["Intelligent", "Compassionate", "Athletic"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-6438",
    name: "Michael",
    age: 29,
    ethnicity: "Asian",
    hairColor: "Black",
    eyeColor: "Brown",
    height: '5\'9"',
    heightInches: 69,
    weight: 170,
    education: "MD - Medical Doctor",
    occupation: "Physician",
    bloodType: "AB+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: true,
    isExclusive: false,
    photoUrl: "/donors/placeholder-4.jpg",
    interests: ["Medicine", "Travel", "Photography"],
    personalityTraits: ["Compassionate", "Dedicated", "Professional"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
];

export default async function FeaturedDonors() {
  let featuredDonors;
  
  try {
    const dbDonors = await getFeaturedDonors(4);
    featuredDonors = dbDonors.map(transformDonor);
  } catch (error) {
    console.error("Error fetching featured donors:", error);
    // Fallback to mock data
    featuredDonors = mockFeaturedDonors;
  }

  return <FeaturedDonorsClient featuredDonors={featuredDonors} />;
}
