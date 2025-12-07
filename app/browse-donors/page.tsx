"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  ChevronDown,
  Shield,
  Clock,
  Dna,
  Users,
  Loader2,
} from "lucide-react";
import { DonorCard, DonorFilters, type Donor } from "@/components/donors";
import { transformDonor } from "@/lib/utils/donor-transform";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import type { Donor as DatabaseDonor } from "@/lib/supabase/types";

// Legacy mock data - kept as fallback during migration
const mockDonors: Donor[] = [
  {
    id: "XY-7842",
    name: "Marcus",
    age: 28,
    ethnicity: "Caucasian",
    hairColor: "Brown",
    eyeColor: "Blue",
    height: "6'1\"",
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
    height: "5'10\"",
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
    height: "6'3\"",
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
    id: "XY-9024",
    name: "Alexander",
    age: 30,
    ethnicity: "Caucasian",
    hairColor: "Blonde",
    eyeColor: "Green",
    height: "5'11\"",
    heightInches: 71,
    weight: 170,
    education: "PhD in Physics",
    occupation: "University Professor",
    bloodType: "AB+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: true,
    isPopular: false,
    isExclusive: false,
    photoUrl: "/donors/placeholder-4.jpg",
    interests: ["Piano", "Astronomy", "Hiking"],
    personalityTraits: ["Intellectual", "Patient", "Curious"],
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
    height: "5'9\"",
    heightInches: 69,
    weight: 165,
    education: "MD - Medical Doctor",
    occupation: "Resident Physician",
    bloodType: "O-",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: true,
    isExclusive: false,
    photoUrl: "/donors/placeholder-5.jpg",
    interests: ["Tennis", "Meditation", "Travel"],
    personalityTraits: ["Dedicated", "Calm", "Thoughtful"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-2856",
    name: "Christopher",
    age: 27,
    ethnicity: "Caucasian",
    hairColor: "Red",
    eyeColor: "Blue",
    height: "6'0\"",
    heightInches: 72,
    weight: 180,
    education: "Bachelor's in Architecture",
    occupation: "Architect",
    bloodType: "A-",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: true,
    isPopular: false,
    isExclusive: true,
    photoUrl: "/donors/placeholder-6.jpg",
    interests: ["Sketching", "Surfing", "Woodworking"],
    personalityTraits: ["Creative", "Laid-back", "Detail-oriented"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-4573",
    name: "Daniel",
    age: 31,
    ethnicity: "Middle Eastern",
    hairColor: "Black",
    eyeColor: "Brown",
    height: "5'11\"",
    heightInches: 71,
    weight: 178,
    education: "JD - Law Degree",
    occupation: "Attorney",
    bloodType: "B-",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: false,
    isExclusive: false,
    photoUrl: "/donors/placeholder-7.jpg",
    interests: ["Debate", "Golf", "Wine Tasting"],
    personalityTraits: ["Articulate", "Confident", "Fair-minded"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-8195",
    name: "Ryan",
    age: 25,
    ethnicity: "Mixed - Caucasian/Asian",
    hairColor: "Brown",
    eyeColor: "Hazel",
    height: "5'10\"",
    heightInches: 70,
    weight: 168,
    education: "Bachelor's in Music",
    occupation: "Music Teacher",
    bloodType: "O+",
    cmvStatus: "Positive",
    availability: "Available",
    isNew: true,
    isPopular: true,
    isExclusive: false,
    photoUrl: "/donors/placeholder-8.jpg",
    interests: ["Guitar", "Songwriting", "Running"],
    personalityTraits: ["Artistic", "Warm", "Energetic"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-1037",
    name: "William",
    age: 33,
    ethnicity: "Caucasian",
    hairColor: "Brown",
    eyeColor: "Brown",
    height: "6'2\"",
    heightInches: 74,
    weight: 190,
    education: "MBA in Marketing",
    occupation: "Marketing Director",
    bloodType: "A+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: false,
    isExclusive: false,
    photoUrl: "/donors/placeholder-9.jpg",
    interests: ["Cycling", "Public Speaking", "Cooking"],
    personalityTraits: ["Charismatic", "Strategic", "Personable"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-5689",
    name: "Anthony",
    age: 28,
    ethnicity: "Italian/Mediterranean",
    hairColor: "Black",
    eyeColor: "Brown",
    height: "5'11\"",
    heightInches: 71,
    weight: 175,
    education: "Bachelor's in Culinary Arts",
    occupation: "Executive Chef",
    bloodType: "O+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: true,
    isExclusive: true,
    photoUrl: "/donors/placeholder-10.jpg",
    interests: ["Cooking", "Gardening", "Soccer"],
    personalityTraits: ["Passionate", "Creative", "Family-oriented"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-7321",
    name: "Benjamin",
    age: 29,
    ethnicity: "Caucasian",
    hairColor: "Blonde",
    eyeColor: "Blue",
    height: "6'0\"",
    heightInches: 72,
    weight: 182,
    education: "Master's in Environmental Science",
    occupation: "Environmental Consultant",
    bloodType: "AB-",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: true,
    isPopular: false,
    isExclusive: false,
    photoUrl: "/donors/placeholder-11.jpg",
    interests: ["Hiking", "Kayaking", "Wildlife Photography"],
    personalityTraits: ["Eco-conscious", "Adventurous", "Thoughtful"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
  {
    id: "XY-4892",
    name: "Jonathan",
    age: 30,
    ethnicity: "African American",
    hairColor: "Black",
    eyeColor: "Brown",
    height: "6'1\"",
    heightInches: 73,
    weight: 188,
    education: "DDS - Dental Degree",
    occupation: "Dentist",
    bloodType: "B+",
    cmvStatus: "Negative",
    availability: "Available",
    isNew: false,
    isPopular: false,
    isExclusive: false,
    photoUrl: "/donors/placeholder-12.jpg",
    interests: ["Jazz Music", "Mentoring", "Fitness"],
    personalityTraits: ["Caring", "Professional", "Community-focused"],
    medicalHistory: "No significant medical history",
    geneticTests: 569,
  },
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Most Popular", value: "popular" },
  { label: "Height (Tallest)", value: "height-desc" },
  { label: "Height (Shortest)", value: "height-asc" },
  { label: "Age (Youngest)", value: "age-asc" },
  { label: "Age (Oldest)", value: "age-desc" },
];

const trustBadges = [
  { icon: Shield, label: "569 Genetic Tests" },
  { icon: Users, label: "100% Identity Disclosed" },
  { icon: Clock, label: "50 Years Experience" },
  { icon: Dna, label: "Comprehensive Screening" },
];

export default function BrowseDonorsPage() {
  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Fetch donors from Supabase
  useEffect(() => {
    async function fetchDonors() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/donors');
        if (!response.ok) {
          throw new Error('Failed to fetch donors');
        }
        const { donors: dbDonors } = await response.json() as { donors: DatabaseDonor[] };
        const transformedDonors = dbDonors.map(transformDonor);
        setDonors(transformedDonors);
      } catch (err) {
        console.error("Error fetching donors:", err);
        setError("Failed to load donors. Please try again later.");
        // Fallback to mock data if Supabase fails
        setDonors(mockDonors);
      } finally {
        setLoading(false);
      }
    }

    fetchDonors();
  }, []);

  // Filter and sort donors
  const filteredDonors = useMemo(() => {
    let result = [...donors];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (donor) =>
          donor.name.toLowerCase().includes(query) ||
          donor.id.toLowerCase().includes(query) ||
          donor.ethnicity.toLowerCase().includes(query) ||
          donor.education.toLowerCase().includes(query) ||
          donor.occupation.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(selectedFilters).forEach(([filterId, values]) => {
      if (values.length === 0) return;

      switch (filterId) {
        case "ethnicity":
          result = result.filter((donor) =>
            values.some((v) =>
              donor.ethnicity.toLowerCase().includes(v.replace("-", " "))
            )
          );
          break;
        case "hairColor":
          result = result.filter((donor) =>
            values.some((v) => donor.hairColor.toLowerCase() === v)
          );
          break;
        case "eyeColor":
          result = result.filter((donor) =>
            values.some((v) => donor.eyeColor.toLowerCase() === v)
          );
          break;
        case "height":
          result = result.filter((donor) => {
            return values.some((v) => {
              switch (v) {
                case "under-68":
                  return donor.heightInches < 68;
                case "68-71":
                  return donor.heightInches >= 68 && donor.heightInches <= 71;
                case "72-74":
                  return donor.heightInches >= 72 && donor.heightInches <= 74;
                case "over-74":
                  return donor.heightInches > 74;
                default:
                  return true;
              }
            });
          });
          break;
        case "cmvStatus":
          result = result.filter((donor) =>
            values.some((v) => donor.cmvStatus.toLowerCase() === v)
          );
          break;
        case "availability":
          result = result.filter((donor) => {
            return values.some((v) => {
              switch (v) {
                case "new":
                  return donor.isNew;
                case "popular":
                  return donor.isPopular;
                case "exclusive":
                  return donor.isExclusive;
                default:
                  return true;
              }
            });
          });
          break;
      }
    });

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "popular":
        result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
        break;
      case "height-desc":
        result.sort((a, b) => b.heightInches - a.heightInches);
        break;
      case "height-asc":
        result.sort((a, b) => a.heightInches - b.heightInches);
        break;
      case "age-asc":
        result.sort((a, b) => a.age - b.age);
        break;
      case "age-desc":
        result.sort((a, b) => b.age - a.age);
        break;
    }

    return result;
  }, [searchQuery, selectedFilters, sortBy]);

  const handleFilterChange = (filterId: string, values: string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: values,
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({});
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Header */}
      <section className="bg-gradient-hero pt-32 pb-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-white mb-4">Browse Our Donors</h1>
            <p className="text-xl text-navy-200 max-w-2xl mx-auto mb-8">
              Explore our carefully screened donors. Each has completed 569
              genetic tests and provides identity disclosure.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search by name, ID, ethnicity, education..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="trust-badge"
                >
                  <badge.icon className="w-4 h-4" />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <DonorFilters
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            isMobileOpen={isMobileFiltersOpen}
            onMobileClose={() => setIsMobileFiltersOpen(false)}
          />

          {/* Donor Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-navy-200 text-navy-700 hover:bg-cream-100"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </button>

                {/* Results Count */}
                <p className="text-navy-600">
                  <span className="font-semibold text-navy-900">
                    {filteredDonors.length}
                  </span>{" "}
                  donors found
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 bg-white rounded-lg border border-navy-200 text-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-400 cursor-pointer"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
                </div>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center bg-white rounded-lg border border-navy-200 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "grid"
                        ? "bg-navy-900 text-white"
                        : "text-navy-600 hover:bg-cream-100"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "bg-navy-900 text-white"
                        : "text-navy-600 hover:bg-cream-100"
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Donor Cards */}
            {loading ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                <p className="text-navy-600">Loading donors...</p>
              </div>
            ) : error && donors.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Retry
                </button>
              </div>
            ) : !user ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <h3 className="text-xl font-heading font-semibold text-navy-900 mb-2">
                  Sign up for free access
                </h3>
                <p className="text-navy-600 mb-6">
                  Create a free account to browse all donor profiles
                </p>
                <Link href="/signup" className="btn btn-primary">
                  Start Free Trial
                </Link>
              </div>
            ) : filteredDonors.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {filteredDonors.map((donor, index) => (
                  <DonorCard key={donor.id} donor={donor} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-2xl"
              >
                <Search className="w-16 h-16 text-navy-200 mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold text-navy-900 mb-2">
                  No donors found
                </h3>
                <p className="text-navy-600 mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={handleClearAll}
                  className="btn btn-primary"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

