"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  Sparkles,
  GraduationCap,
  Ruler,
  Eye,
  Crown,
  ArrowRight,
} from "lucide-react";

export interface Donor {
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

interface DonorCardProps {
  donor: Donor;
  index?: number;
}

const hairColors: Record<string, string> = {
  Brown: "#8B4513",
  Black: "#1a1a1a",
  Blonde: "#F5DEB3",
  Red: "#CD5C5C",
};

export default function DonorCard({ donor, index = 0 }: DonorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link href={`/browse-donors/${donor.id}`} className="group block h-full">
        <div className="h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 card-hover">
          {/* Photo Placeholder */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-100 to-navy-200">
            {/* Placeholder Avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-navy-300 flex items-center justify-center">
                <span className="text-3xl font-heading font-bold text-navy-600">
                  {donor.name.charAt(0)}
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {donor.isNew && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  <Sparkles className="w-3 h-3" />
                  New
                </span>
              )}
              {donor.isPopular && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gold-500 text-white text-xs font-medium rounded-full">
                  <Star className="w-3 h-3" />
                  Popular
                </span>
              )}
              {donor.isExclusive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                  <Crown className="w-3 h-3" />
                  Exclusive
                </span>
              )}
            </div>

            {/* CMV Status */}
            {donor.cmvStatus === "Negative" && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  CMV-
                </span>
              </div>
            )}

            {/* Donor ID */}
            <div className="absolute bottom-4 right-4">
              <span className="px-2.5 py-1 bg-navy-900/80 backdrop-blur-sm text-white text-xs font-mono rounded">
                {donor.id}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-heading font-semibold text-navy-900 group-hover:text-gold-700 transition-colors">
                  {donor.name}, {donor.age}
                </h3>
                <p className="text-sm text-navy-500 mt-0.5">{donor.ethnicity}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex items-center gap-1.5 text-sm text-navy-600">
                <Ruler className="w-4 h-4 text-gold-500" />
                <span>{donor.height}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-navy-600">
                <Eye className="w-4 h-4 text-gold-500" />
                <span>{donor.eyeColor}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-navy-600">
                <div
                  className="w-4 h-4 rounded-full border-2 border-gold-500"
                  style={{
                    backgroundColor: hairColors[donor.hairColor] || "#888",
                  }}
                />
                <span>{donor.hairColor}</span>
              </div>
            </div>

            {/* Education */}
            <div className="mt-4 flex items-center gap-2 text-sm text-navy-600">
              <GraduationCap className="w-4 h-4 text-gold-500 flex-shrink-0" />
              <span className="truncate">{donor.education}</span>
            </div>

            {/* Interests */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {donor.interests.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-0.5 bg-cream-100 text-navy-600 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>

            {/* View Profile Button */}
            <div className="mt-5 pt-5 border-t border-navy-100">
              <span className="flex items-center justify-center gap-2 text-gold-600 font-medium group-hover:text-gold-700 transition-colors">
                View Full Profile
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

