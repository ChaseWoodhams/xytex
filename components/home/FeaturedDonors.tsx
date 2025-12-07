"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  Sparkles,
  GraduationCap,
  Ruler,
  Eye,
  Loader2,
} from "lucide-react";
import { transformDonor } from "@/lib/utils/donor-transform";
import type { Donor } from "@/components/donors/DonorCard";
import type { Donor as DatabaseDonor } from "@/lib/supabase/types";

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
    education: "Master's in Engineering",
    isNew: true,
    isPopular: false,
  },
  {
    id: "XY-5291",
    name: "David",
    age: 32,
    ethnicity: "Hispanic/Latino",
    hairColor: "Black",
    eyeColor: "Brown",
    height: '5\'10"',
    education: "MBA in Finance",
    isNew: false,
    isPopular: true,
  },
  {
    id: "XY-3167",
    name: "James",
    age: 26,
    ethnicity: "African American",
    hairColor: "Black",
    eyeColor: "Brown",
    height: '6\'3"',
    education: "Bachelor's in Biology",
    isNew: false,
    isPopular: true,
  },
  {
    id: "XY-6438",
    name: "Michael",
    age: 29,
    ethnicity: "Asian",
    hairColor: "Black",
    eyeColor: "Brown",
    height: '5\'9"',
    education: "MD - Medical Doctor",
    isNew: false,
    isPopular: true,
  },
];

export default function FeaturedDonors() {
  const [featuredDonors, setFeaturedDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const response = await fetch('/api/donors?featured=true&limit=4');
        if (!response.ok) {
          throw new Error('Failed to fetch featured donors');
        }
        const { donors: dbDonors } = await response.json() as { donors: DatabaseDonor[] };
        const transformed = dbDonors.map(transformDonor);
        setFeaturedDonors(transformed);
      } catch (error) {
        console.error("Error fetching featured donors:", error);
        // Fallback to mock data
        setFeaturedDonors(mockFeaturedDonors as Donor[]);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  return (
    <section 
      className="section-padding bg-gradient-subtle"
      aria-labelledby="featured-donors-heading"
    >
      <div className="container-custom">
        {/* Section Header - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 
            id="featured-donors-heading"
            className="text-navy-900 mb-4"
          >
            Featured Donors
          </h2>
          <p className="text-lg text-navy-700 max-w-2xl mx-auto leading-relaxed">
            Each donor has completed 569 genetic tests and provides identity disclosure.
          </p>
        </motion.div>

        {/* Donor Cards Grid - 4 cards, cleaner layout */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-4" />
            <p className="text-navy-600">Loading featured donors...</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {featuredDonors.map((donor, index) => (
            <motion.div
              key={donor.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link 
                href={`/browse-donors/${donor.id}`} 
                className="group block focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-4 rounded-2xl"
                aria-label={`View profile for donor ${donor.name}, ${donor.id}`}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 card-hover h-full">
                  {/* Photo Placeholder */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-100 to-navy-200" aria-hidden="true">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-navy-300 flex items-center justify-center shadow-md">
                        <span className="text-2xl font-heading font-bold text-navy-600">
                          {donor.name.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {donor.isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          New
                        </span>
                      )}
                      {donor.isPopular && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-500 text-white text-xs font-semibold rounded-full shadow-sm">
                          <Star className="w-3 h-3" aria-hidden="true" />
                          Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content - Compact */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-heading font-semibold text-navy-900 group-hover:text-gold-700 transition-colors">
                        {donor.name}, {donor.age}
                      </h3>
                      <p className="text-sm text-navy-600 mt-0.5">
                        {donor.ethnicity}
                      </p>
                    </div>

                    {/* Stats - Compact */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-navy-700">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" aria-hidden="true" />
                        <span>{donor.height}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" aria-hidden="true" />
                        <span>{donor.eyeColor}</span>
                      </div>
                    </div>

                    {/* Education - Compact */}
                    <div className="flex items-center gap-1.5 text-xs text-navy-600 mb-3">
                      <GraduationCap className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{donor.education}</span>
                    </div>

                    {/* View Profile - Compact */}
                    <div className="pt-3 border-t border-navy-100">
                      <span className="flex items-center justify-center gap-1.5 text-gold-600 font-semibold text-sm group-hover:text-gold-700 transition-colors">
                        View Profile
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
            ))}
          </div>
        )}

        {/* CTA - Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="/browse-donors"
            className="btn btn-primary text-base px-8 py-4 inline-flex items-center gap-2"
            aria-label="View all 200 plus donors"
          >
            View All 200+ Donors
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
