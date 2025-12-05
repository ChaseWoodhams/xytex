"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";

export default function CTASection() {
  return (
    <section 
      className="relative py-20 lg:py-24 bg-gradient-hero overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,165,116,0.4) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-gold-500/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-navy-500/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Headline - Simplified */}
          <h2 
            id="cta-heading"
            className="text-white text-4xl md:text-5xl font-heading font-bold mb-6 leading-tight"
          >
            Ready to Start Your Family?
          </h2>

          {/* Subhead - Concise */}
          <p className="text-xl text-navy-100 mb-10 leading-relaxed">
            Browse 200+ identity-disclosed donors free for 7 days. No credit card required.
          </p>

          {/* Primary CTA - Single, prominent */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/browse-donors"
              className="btn btn-primary text-lg px-10 py-5 inline-flex items-center gap-3"
              aria-label="Browse donors free for 7 days"
            >
              Browse Donors Free
              <ArrowRight className="w-6 h-6" aria-hidden="true" />
            </Link>
          </div>

          {/* Contact Option - Minimal */}
          <div className="flex justify-center">
            <a
              href="tel:1-800-277-3210"
              className="flex items-center gap-2 text-navy-200 hover:text-gold-300 transition-colors text-lg"
              aria-label="Call us at 1-800-277-3210"
            >
              <Phone className="w-5 h-5 text-gold-400" aria-hidden="true" />
              <span>1-800-277-3210</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
