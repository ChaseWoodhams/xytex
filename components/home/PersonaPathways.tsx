"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, User, Users, UserPlus, Search, Calendar, Truck } from "lucide-react";

const personas = [
  {
    id: "lgbtq",
    title: "LGBTQ+ Couples",
    description:
      "Building your family with inclusive support and understanding.",
    href: "/lgbtq-family-building",
    icon: Users,
    color: "from-navy-800 to-navy-900",
    accent: "gold",
  },
  {
    id: "smbc",
    title: "Single Mothers by Choice",
    description:
      "Your family. Your timeline. Your terms.",
    href: "/single-mother-by-choice",
    icon: User,
    color: "from-gold-600 to-gold-700",
    accent: "navy",
  },
  {
    id: "couples",
    title: "Couples with Infertility",
    description:
      "Navigate your fertility journey with compassionate guidance.",
    href: "/infertility-solutions",
    icon: Heart,
    color: "from-navy-700 to-navy-800",
    accent: "gold",
  },
];

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Free Account",
    description: "Sign up and get 7-day free access to browse all donor profiles.",
  },
  {
    number: "02",
    icon: Search,
    title: "Browse Donors Together",
    description: "Explore profiles, photos, and essays. Take your time.",
  },
  {
    number: "03",
    icon: Calendar,
    title: "Schedule Consultation",
    description: "Talk to our team about your journey and get personalized guidance.",
  },
  {
    number: "04",
    icon: Truck,
    title: "Order & Ship",
    description: "Select your vials and ship to your clinic. We'll coordinate everything.",
  },
];

export default function PersonaPathways() {
  return (
    <section 
      className="section-padding bg-gradient-subtle"
      aria-labelledby="getting-started-heading"
    >
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 
            id="getting-started-heading"
            className="text-navy-900 mb-4"
          >
            Getting Started
          </h2>
          <div className="divider-gold mx-auto" />
        </motion.div>

        {/* Part 1: I'm building a family as... */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
              I&apos;m building a family as...
            </h3>
            <p className="text-navy-700">
              Select your path for personalized guidance and support.
            </p>
          </motion.div>

          {/* Persona Cards - Compact */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {personas.map((persona, index) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link 
                  href={persona.href} 
                  className="group block h-full focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-4 rounded-2xl"
                  aria-label={`Learn more about ${persona.title}`}
                >
                  <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 card-hover">
                    {/* Gradient Header - Compact */}
                    <div
                      className={`h-32 bg-gradient-to-br ${persona.color} relative overflow-hidden`}
                      aria-hidden="true"
                    >
                      {/* Subtle pattern overlay */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, ${
                            persona.accent === "gold" ? "rgba(212,165,116,0.5)" : "rgba(255,255,255,0.3)"
                          } 1px, transparent 0)`,
                          backgroundSize: "24px 24px",
                        }}
                      />

                      {/* Accent gradient overlay */}
                      {persona.accent === "gold" && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold-500/10 to-gold-400/20" />
                      )}

                      {/* Icon - Compact */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-14 h-14 rounded-xl ${
                          persona.accent === "gold" 
                            ? "bg-gold-500/20 backdrop-blur-sm border border-gold-400/30" 
                            : "bg-white/20 backdrop-blur-sm border border-white/30"
                        } flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                          <persona.icon className={`w-7 h-7 ${
                            persona.accent === "gold" ? "text-gold-200" : "text-white"
                          }`} aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    {/* Content - Compact */}
                    <div className="p-5">
                      <h4 className="text-lg font-heading font-semibold text-navy-900 group-hover:text-gold-700 transition-colors mb-1">
                        {persona.title}
                      </h4>
                      <p className="text-navy-700 leading-relaxed text-sm mb-3">
                        {persona.description}
                      </p>

                      {/* Link - Compact */}
                      <div className="flex items-center gap-2 text-gold-600 font-semibold group-hover:text-gold-700 transition-colors text-sm">
                        <span>Learn More</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
        </div>

        {/* Part 2: Your Journey Begins Here - 4 Steps */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
              Your Journey Begins Here
            </h3>
            <p className="text-navy-700">
              A simple, straightforward process from start to finish.
            </p>
          </motion.div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                {/* Step Number & Icon */}
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-navy-900 flex items-center justify-center shadow-lg mb-2">
                    <step.icon className="w-10 h-10 text-gold-400" aria-hidden="true" />
                  </div>
                  <span 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold-500 text-navy-900 text-sm font-bold flex items-center justify-center shadow-md"
                    aria-label={`Step ${step.number.replace("0", "")}`}
                  >
                    {step.number.replace("0", "")}
                  </span>
                </div>

                {/* Content */}
                <h4 className="text-lg font-heading font-semibold text-navy-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-navy-700 leading-relaxed text-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
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
              aria-label="Create your free account"
            >
              Create Your Free Account
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
