"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Users,
  Globe,
  Dna,
  Shield,
  Award,
  MapPin,
  Phone,
  Mail,
  Building,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { PageHero } from "@/components/shared";

const timeline = [
  {
    year: "1975",
    title: "Founded in Augusta",
    description:
      "Dr. Armando Hernandez-Cossio establishes Xytex Corporation, pioneering the frozen sperm banking industry in the Southeast.",
  },
  {
    year: "1985",
    title: "National Expansion",
    description:
      "Xytex begins shipping nationwide, becoming one of the first sperm banks to serve families across all 50 states.",
  },
  {
    year: "1995",
    title: "International Reach",
    description:
      "We expand to serve families globally, now shipping to over 35 countries and establishing ourselves as an international leader.",
  },
  {
    year: "2005",
    title: "Advanced Genetic Testing",
    description:
      "Xytex implements comprehensive genetic screening programs, staying at the forefront of reproductive technology.",
  },
  {
    year: "2017",
    title: "100% Identity Disclosure",
    description:
      "All new donors become identity-disclosed, giving donor-conceived individuals the choice to connect at age 18.",
  },
  {
    year: "2020",
    title: "Invitae Partnership",
    description:
      "Partnership with Invitae brings 569-condition genetic testing, the most comprehensive panel in the industry.",
  },
  {
    year: "2025",
    title: "50 Years of Families",
    description:
      "Celebrating five decades of helping families achieve their dreams of parenthood. The journey continues.",
  },
];

const stats = [
  { number: "50+", label: "Years of Experience", icon: Clock },
  { number: "35+", label: "Countries Served", icon: Globe },
  { number: "200+", label: "Active Donors", icon: Users },
  { number: "569", label: "Genetic Tests", icon: Dna },
];

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Every donor undergoes rigorous screening. We test for 569 genetic conditions and maintain the highest FDA and AATB standards.",
  },
  {
    icon: Heart,
    title: "Family-Focused",
    description:
      "We support all paths to parenthood. LGBTQ+ families, single parents by choice, and couples facing infertility are all welcomed.",
  },
  {
    icon: Users,
    title: "Identity Matters",
    description:
      "All donors since 2017 are identity disclosed. We believe donor-conceived individuals deserve the choice to know their origins.",
  },
  {
    icon: Award,
    title: "Excellence Always",
    description:
      "50 years of continuous improvement and innovation. We're committed to providing the best possible experience for every family.",
  },
];

const accreditations = [
  { name: "FDA Registered", description: "Facility Registration #3006830618" },
  { name: "AATB Accredited", description: "American Association of Tissue Banks" },
  { name: "CAP Accredited", description: "College of American Pathologists" },
  { name: "CLIA Certified", description: "Clinical Laboratory Improvement Amendments" },
];

const locations = [
  {
    name: "Augusta Headquarters",
    address: "1100 Emmett Street",
    city: "Augusta, GA 30904",
    type: "Headquarters & Collection Center",
  },
  {
    name: "Atlanta Collection Center",
    address: "5673 Peachtree Dunwoody Rd",
    city: "Atlanta, GA 30342",
    type: "Collection Center",
  },
];

const leadership = [
  {
    name: "Leadership Team",
    role: "Dedicated to Your Success",
    description:
      "Our experienced team of medical professionals, counselors, and support staff are here to guide you through every step of your family-building journey.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        eyebrow="About Xytex"
        title="50 Years of Building"
        titleHighlight="Families."
        description="Since 1975, Xytex has helped thousands of families across the globe achieve their dreams of parenthood. We're America's longest-running sperm bank."
        primaryCTA={{ text: "Browse Donors", href: "/browse-donors" }}
        secondaryCTA={{ text: "Contact Us", href: "/contact" }}
        variant="centered"
      />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gold-100 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-gold-600" />
                </div>
                <div className="text-4xl font-heading font-bold text-navy-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-navy-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
              Our Journey
            </span>
            <h2 className="mt-3 text-navy-900">50 Years of History</h2>
            <div className="divider-gold mx-auto mt-6" />
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gold-300 -translate-x-1/2" />

            {timeline.map((event, index) => (
              <motion.div
                key={event.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-center gap-8 mb-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline Node */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-gold-500 -translate-x-1/2 flex items-center justify-center ring-4 ring-white z-10">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>

                {/* Content */}
                <div
                  className={`flex-1 ml-16 md:ml-0 ${
                    index % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"
                  }`}
                >
                  <span className="inline-block px-3 py-1 bg-gold-100 text-gold-700 text-sm font-bold rounded-full mb-2">
                    {event.year}
                  </span>
                  <h3 className="text-xl font-heading font-semibold text-navy-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-navy-600">{event.description}</p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
              What We Stand For
            </span>
            <h2 className="mt-3 text-navy-900">Our Values</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-5"
              >
                <div className="w-14 h-14 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-7 h-7 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-navy-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-navy-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditations Section */}
      <section className="section-padding bg-navy-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-gold-400 font-medium text-sm uppercase tracking-wider">
              Certified Excellence
            </span>
            <h2 className="text-white mt-3">
              Accreditations & Certifications
            </h2>
            <p className="mt-4 text-navy-300 max-w-2xl mx-auto">
              We maintain the highest standards in the industry with comprehensive
              accreditations from leading regulatory bodies.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {accreditations.map((acc, index) => (
              <motion.div
                key={acc.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-navy-800/50 rounded-xl p-6 text-center border border-navy-700"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-white mb-1">
                  {acc.name}
                </h3>
                <p className="text-sm text-navy-400">{acc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
              Meet Our Team
            </span>
            <h2 className="mt-3 text-navy-900">Dedicated Professionals</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-lg text-center"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-navy-400" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-3">
              {leadership[0].name}
            </h3>
            <p className="text-gold-600 font-medium mb-4">{leadership[0].role}</p>
            <p className="text-navy-600 leading-relaxed mb-6">
              {leadership[0].description}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Medical Directors",
                "Genetic Counselors",
                "Client Services",
                "Laboratory Specialists",
              ].map((role) => (
                <span
                  key={role}
                  className="px-4 py-2 bg-cream-100 text-navy-700 rounded-full text-sm font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
              Find Us
            </span>
            <h2 className="mt-3 text-navy-900">Our Locations</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {locations.map((location, index) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-cream-50 rounded-2xl p-8"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-navy-900">
                      {location.name}
                    </h3>
                    <span className="text-sm text-gold-600 font-medium">
                      {location.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-navy-600">
                  <MapPin className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{location.address}</p>
                    <p>{location.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 max-w-2xl mx-auto bg-navy-900 rounded-2xl p-8"
          >
            <div className="grid sm:grid-cols-2 gap-6 text-center">
              <a
                href="tel:1-800-277-3210"
                className="flex flex-col items-center gap-2 text-white hover:text-gold-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium">1-800-277-3210</span>
                <span className="text-sm text-navy-400">Mon-Fri 9am-5pm EST</span>
              </a>
              <a
                href="mailto:info@xytex.com"
                className="flex flex-col items-center gap-2 text-white hover:text-gold-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium">info@xytex.com</span>
                <span className="text-sm text-navy-400">We respond within 24 hours</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-white text-3xl md:text-4xl font-heading font-bold mb-6">
              Ready to Start{" "}
              <span className="text-gradient">Your Journey?</span>
            </h2>
            <p className="text-xl text-navy-200 mb-10">
              Join the thousands of families who have trusted Xytex for 50 years.
              We&apos;re here to support you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/browse-donors"
                className="btn btn-primary text-base px-8 py-4"
              >
                Browse Donors
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="btn btn-white text-base px-8 py-4"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

