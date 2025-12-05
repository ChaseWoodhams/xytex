"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, UserCheck, Truck, Baby, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Browse Donors",
    description:
      "Create a free account and get 7-day unlimited access to browse all donor profiles, photos, and medical histories.",
    color: "from-navy-600 to-navy-700",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Choose Your Match",
    description:
      "Review detailed profiles including photos, essays, audio interviews, personality assessments, and genetic testing results.",
    color: "from-navy-700 to-navy-800",
  },
  {
    number: "03",
    icon: Truck,
    title: "Order & Ship",
    description:
      "Select your vial type, choose shipping to your clinic or home (where permitted), and we'll handle the rest.",
    color: "from-navy-800 to-navy-900",
  },
  {
    number: "04",
    icon: Baby,
    title: "Start Your Family",
    description:
      "Our team is here to support you every step of the way with ongoing guidance and resources.",
    color: "from-gold-600 to-gold-700",
  },
];

export default function HowItWorks() {
  return (
    <section 
      className="section-padding bg-navy-900 relative overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-navy-400/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="container-custom relative z-10">
        {/* Section Header - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="text-gold-400 font-medium text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 
            id="how-it-works-heading"
            className="mt-4 text-white"
          >
            How It Works
          </h2>
          <p className="mt-6 text-lg md:text-xl text-navy-200 max-w-3xl mx-auto leading-relaxed">
            From your first search to starting your family, our streamlined
            process makes building your family straightforward and stress-free.
          </p>
        </motion.div>

        {/* Steps - Enhanced spacing and readability */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div 
                  className="hidden lg:block absolute top-16 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px"
                  aria-hidden="true"
                >
                  <div className="w-full h-full bg-gradient-to-r from-gold-500/50 to-gold-500/0" />
                </div>
              )}

              <div className="text-center">
                {/* Step Number - Enhanced */}
                <div className="relative inline-block mb-8">
                  <div
                    className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}
                    aria-hidden="true"
                  >
                    <step.icon className="w-12 h-12 text-white" aria-hidden="true" />
                  </div>
                  <span 
                    className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gold-500 text-navy-900 text-base font-bold flex items-center justify-center shadow-lg"
                    aria-label={`Step ${step.number.replace("0", "")}`}
                  >
                    {step.number.replace("0", "")}
                  </span>
                </div>

                {/* Content - Improved typography */}
                <h3 className="text-xl lg:text-2xl font-heading font-semibold text-white mb-4 leading-tight">
                  {step.title}
                </h3>
                <p className="text-navy-200 leading-relaxed text-base">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16 lg:mt-20"
        >
          <Link 
            href="/browse-donors" 
            className="btn btn-primary text-base px-8 py-4"
            aria-label="Get started with a free account"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
