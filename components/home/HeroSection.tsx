"use client";

import Link from "next/link";
import { ArrowRight, Shield, Clock, Dna } from "lucide-react";

const keyTrustItems = [
  { icon: Clock, label: "50 Years", stat: "Since 1975" },
  { icon: Dna, label: "569 Tests", stat: "Genetic Screening" },
  { icon: Shield, label: "FDA Registered", stat: "Trusted & Safe" },
];

export default function HeroSection() {
  return (
    <section 
      className="relative min-h-[85vh] flex items-center bg-gradient-hero overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background Pattern - z-0 */}
      <div className="absolute inset-0 opacity-10 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,165,116,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Gradient Overlay - z-0 */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950/50 via-transparent to-gold-900/20 z-0" aria-hidden="true" />

      {/* Decorative Elements - z-0 (behind all content) */}
      <div className="absolute top-40 right-20 w-96 h-96 rounded-full bg-gold-500 blur-3xl opacity-10 z-0" aria-hidden="true" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-navy-400 blur-3xl opacity-[0.08] z-0" aria-hidden="true" />

      <div className="container-custom relative z-10 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow - Simplified */}
          <div
            className="mb-6 animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-gold-500/30 text-gold-300 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" aria-hidden="true" />
              America&apos;s Longest-Running Sperm Bank
            </span>
          </div>

          {/* Main Headline - Simplified and focused */}
          <h1
            className="text-white mb-6 animate-fade-in-up leading-tight"
            style={{ animationDelay: "100ms" }}
          >
            Find Your Perfect Donor
            <br />
            <span className="text-gradient">Identity Disclosed.</span>
            <br />
            <span className="text-white text-4xl md:text-5xl">50 Years of Trust.</span>
          </h1>

          {/* Subheadline - Enhanced readability */}
          <p
            className="text-2xl md:text-3xl text-white mb-10 leading-relaxed animate-fade-in-up max-w-3xl mx-auto font-medium"
            style={{ animationDelay: "200ms", color: "#ffffff" }}
          >
            Browse 200+ donors with adult photos, 569 genetic tests, and complete identity disclosure.
            <br className="hidden md:block" />
            <span className="text-white"> Free 7-day access to all profiles.</span>
          </p>

          {/* Primary CTA - Single, prominent */}
          <div
            className="mb-12 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link 
              href="/browse-donors" 
              className="btn btn-primary text-lg px-10 py-5 inline-flex items-center gap-3"
              aria-label="Browse donors free for 7 days"
            >
              Browse Donors Free for 7 Days
              <ArrowRight className="w-6 h-6" aria-hidden="true" />
            </Link>
            <p className="text-white/70 text-sm mt-4">
              No credit card required • Cancel anytime
            </p>
          </div>

          {/* Key Trust Items - Condensed to 3 */}
          <div
            className="flex flex-wrap justify-center gap-8 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
            role="list"
            aria-label="Trust indicators"
          >
            {keyTrustItems.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-white"
                role="listitem"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-gold-400" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">{item.label}</div>
                  <div className="text-sm text-white/70">{item.stat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
