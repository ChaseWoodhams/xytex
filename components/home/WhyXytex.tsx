"use client";

import { motion } from "framer-motion";
import { UserCheck, Camera, Dna } from "lucide-react";

// Reduced to top 3 differentiators - most important for conversion
const features = [
  {
    icon: UserCheck,
    title: "100% Identity Disclosed",
    description:
      "All donors since 2017 are identity disclosed. Your child can connect with their donor when they turn 18.",
  },
  {
    icon: Camera,
    title: "Adult Photos Available",
    description:
      "See both baby AND adult photos—unlike most banks. Know who your child may resemble.",
  },
  {
    icon: Dna,
    title: "569 Genetic Tests",
    description:
      "Industry-leading screening through our Invitae partnership. The most comprehensive in the business.",
  },
];

export default function WhyXytex() {
  return (
    <section 
      className="section-padding bg-white"
      aria-labelledby="why-xytex-heading"
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
            id="why-xytex-heading"
            className="text-navy-900 mb-4"
          >
            Why Choose Xytex
          </h2>
          <div className="divider-gold mx-auto" />
        </motion.div>

        {/* Features Grid - Reduced to 3, horizontal layout */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-navy-900 flex items-center justify-center mb-4 mx-auto shadow-md">
                <feature.icon className="w-8 h-8 text-gold-400" aria-hidden="true" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-heading font-semibold text-navy-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-navy-700 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
