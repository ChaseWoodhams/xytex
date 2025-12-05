"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Shield,
  Package,
  Truck,
  Warehouse,
  Clock,
  BadgePercent,
  Calculator,
  Phone,
  CreditCard,
  Info,
} from "lucide-react";
import { PageHero } from "@/components/shared";

const vialPricing = [
  {
    type: "ICI",
    name: "Intracervical Insemination",
    price: 895,
    description:
      "Unwashed sperm ideal for at-home insemination or clinical use near the cervix.",
    features: [
      { text: "Suitable for home use", included: true },
      { text: "Natural seminal fluid", included: true },
      { text: "569 genetic tests included", included: true },
      { text: "Identity disclosure", included: true },
    ],
    popular: false,
    homeUse: true,
  },
  {
    type: "IUI",
    name: "Intrauterine Insemination",
    price: 995,
    description:
      "Washed and concentrated sperm designed for clinical intrauterine procedures.",
    features: [
      { text: "Optimal for clinical IUI", included: true },
      { text: "Washed & concentrated", included: true },
      { text: "569 genetic tests included", included: true },
      { text: "Identity disclosure", included: true },
    ],
    popular: true,
    homeUse: true,
  },
  {
    type: "ART",
    name: "Assisted Reproductive Tech",
    price: 995,
    description:
      "Specially prepared for IVF and ICSI procedures at fertility clinics.",
    features: [
      { text: "IVF & ICSI optimized", included: true },
      { text: "Premium preparation", included: true },
      { text: "569 genetic tests included", included: true },
      { text: "Identity disclosure", included: true },
    ],
    popular: false,
    homeUse: false,
  },
];

const includedWithEveryVial = [
  "Full donor profile access",
  "3-generation medical history",
  "569 genetic condition screening",
  "Baby AND adult photos",
  "Audio interview access",
  "Personality assessments",
  "Staff impressions",
  "Donor essays",
];

const additionalCosts = [
  { item: "Overnight Shipping (Continental US)", price: "$350" },
  { item: "2-Day Shipping (Continental US)", price: "$275" },
  { item: "International Shipping", price: "Starting at $750" },
  { item: "Dry Shipper Tank Deposit", price: "$875", note: "Refundable" },
  { item: "Profile Access", price: "$25", note: "30-day unlimited access" },
  { item: "Extended Storage (monthly)", price: "$45/month" },
];

const multiVialBenefits = [
  {
    vials: "4-7 vials",
    storage: "1 year FREE storage",
    buyback: "50% buyback on unused vials",
    discount: "Best for first-time buyers",
  },
  {
    vials: "8+ vials",
    storage: "3 years FREE storage",
    buyback: "50% buyback on unused vials",
    discount: "Best for sibling planning",
  },
];

const guarantees = [
  {
    icon: BadgePercent,
    title: "50% Buyback Guarantee",
    description:
      "Changed your mind or had success? We'll buy back your unused vials at 50% of the purchase price. No questions asked.",
  },
  {
    icon: Warehouse,
    title: "Free Storage",
    description:
      "Purchase 4+ vials and get 1 year of free storage. Purchase 8+ vials for 3 years free. Plan for future siblings with confidence.",
  },
  {
    icon: Shield,
    title: "Quality Assurance",
    description:
      "Every vial meets our rigorous quality standards. If a vial doesn't meet specifications, we'll replace it at no charge.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        eyebrow="Pricing"
        title="Transparent Pricing."
        titleHighlight="No Surprises."
        description="Know exactly what to expect before you begin. We believe in clear, upfront pricing with no hidden fees."
        primaryCTA={{ text: "Browse Donors", href: "/browse-donors" }}
        secondaryCTA={{ text: "Talk to Us", href: "/contact" }}
        variant="centered"
      />

      {/* Vial Pricing Section */}
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
              Vial Types
            </span>
            <h2 className="mt-3 text-navy-900">Choose Your Vial Type</h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              Each vial type is designed for specific procedures. Not sure which
              is right for you? Contact us for guidance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {vialPricing.map((vial, index) => (
              <motion.div
                key={vial.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden ${
                  vial.popular
                    ? "border-gold-400 shadow-xl"
                    : "border-navy-100 shadow-md"
                }`}
              >
                {vial.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gold-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className={`p-8 ${vial.popular ? "pt-14" : ""}`}>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-heading font-bold text-navy-900 mb-1">
                      {vial.type}
                    </h3>
                    <p className="text-sm text-navy-500">{vial.name}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <span className="text-4xl font-heading font-bold text-gold-600">
                      ${vial.price}
                    </span>
                    <span className="text-navy-500 ml-1">per vial</span>
                  </div>

                  {/* Description */}
                  <p className="text-navy-600 text-sm mb-6 text-center">
                    {vial.description}
                  </p>

                  {/* Home Use Badge */}
                  <div className="flex justify-center mb-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                        vial.homeUse
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {vial.homeUse ? (
                        <>
                          <Check className="w-4 h-4" />
                          Home Use Available
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Clinical Use Only
                        </>
                      )}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {vial.features.map((feature) => (
                      <li
                        key={feature.text}
                        className="flex items-center gap-3"
                      >
                        <Check className="w-5 h-5 text-gold-500 flex-shrink-0" />
                        <span className="text-navy-700 text-sm">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/browse-donors"
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                      vial.popular
                        ? "btn btn-primary"
                        : "btn btn-secondary"
                    }`}
                  >
                    Browse Donors
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
                Value Included
              </span>
              <h2 className="mt-3 text-navy-900">What&apos;s Included</h2>
              <p className="mt-4 text-lg text-navy-600">
                Every vial purchase includes comprehensive donor information at
                no additional cost.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {includedWithEveryVial.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 p-3 bg-cream-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-navy-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-navy-900 rounded-xl text-center">
                <p className="text-white font-medium">
                  All donors since 2017 are{" "}
                  <span className="text-gold-400">100% Identity Disclosed</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Costs Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="text-gold-600 font-medium text-sm uppercase tracking-wider">
                Full Transparency
              </span>
              <h2 className="mt-3 text-navy-900">Additional Costs</h2>
              <p className="mt-4 text-lg text-navy-600">
                Here&apos;s everything else you might need to budget for.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-cream-50 rounded-2xl overflow-hidden"
            >
              <table className="w-full">
                <tbody>
                  {additionalCosts.map((cost, index) => (
                    <tr
                      key={cost.item}
                      className={
                        index !== additionalCosts.length - 1
                          ? "border-b border-cream-200"
                          : ""
                      }
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-navy-900">
                          {cost.item}
                        </span>
                        {cost.note && (
                          <span className="block text-sm text-navy-500 mt-0.5">
                            {cost.note}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-semibold text-navy-900">
                          {cost.price}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Multi-Vial Savings Section */}
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
              Save More
            </span>
            <h2 className="text-white mt-3">Multi-Vial Benefits</h2>
            <p className="mt-4 text-lg text-navy-300 max-w-2xl mx-auto">
              Planning for multiple cycles or future siblings? Save with
              multi-vial purchases and free storage.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {multiVialBenefits.map((tier, index) => (
              <motion.div
                key={tier.vials}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-navy-800 rounded-2xl p-8 border border-navy-700"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-8 h-8 text-gold-400" />
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-white">
                      {tier.vials}
                    </h3>
                    <p className="text-sm text-navy-400">{tier.discount}</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gold-400" />
                    <span className="text-white">{tier.storage}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BadgePercent className="w-5 h-5 text-gold-400" />
                    <span className="text-white">{tier.buyback}</span>
                  </li>
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Calculator Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 max-w-2xl mx-auto bg-navy-800/50 rounded-2xl p-8 text-center border border-gold-500/30"
          >
            <Calculator className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold text-white mb-3">
              Cost Calculator
            </h3>
            <p className="text-navy-300 mb-6">
              Get a personalized estimate based on your needs. Enter your
              procedure type, cycle count, and storage requirements.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Get Personalized Quote
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Guarantees Section */}
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
              Your Protection
            </span>
            <h2 className="mt-3 text-navy-900">Our Guarantees</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {guarantees.map((guarantee, index) => (
              <motion.div
                key={guarantee.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-md text-center"
              >
                <div className="w-16 h-16 rounded-xl bg-gold-500 flex items-center justify-center mx-auto mb-6">
                  <guarantee.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy-900 mb-3">
                  {guarantee.title}
                </h3>
                <p className="text-navy-600">{guarantee.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Financing Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <CreditCard className="w-16 h-16 text-gold-400 mx-auto mb-6" />
                <h2 className="text-3xl font-heading font-bold text-white mb-4">
                  Financing Available
                </h2>
                <p className="text-xl text-navy-200 mb-8 max-w-2xl mx-auto">
                  We&apos;ve partnered with CapexMD to offer flexible financing
                  options. Finances shouldn&apos;t stop your family dreams.
                </p>

                <div className="grid sm:grid-cols-3 gap-6 mb-8">
                  {[
                    "Low monthly payments",
                    "Competitive rates",
                    "Quick approval",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-center gap-2 text-gold-300"
                    >
                      <Check className="w-5 h-5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/financing"
                    className="btn btn-primary text-base px-8 py-4"
                  >
                    Apply for Financing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="tel:1-800-277-3210"
                    className="btn btn-outline-gold text-base px-8 py-4"
                  >
                    <Phone className="w-5 h-5" />
                    Talk to Us About Options
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Note */}
      <section className="py-12 bg-cream-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-4 text-center"
          >
            <Info className="w-6 h-6 text-gold-600" />
            <p className="text-navy-600">
              Have questions about pricing?{" "}
              <Link
                href="/faq/pricing-costs"
                className="text-gold-600 font-medium hover:text-gold-700 animated-underline"
              >
                Visit our Pricing FAQ
              </Link>{" "}
              or{" "}
              <a
                href="tel:1-800-277-3210"
                className="text-gold-600 font-medium hover:text-gold-700 animated-underline"
              >
                call us at 1-800-277-3210
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}

