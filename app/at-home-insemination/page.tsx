"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Home,
  Shield,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Download,
  Package,
  Thermometer,
  Calendar,
  Heart,
  AlertTriangle,
  Truck,
  Timer,
  FileText,
  HelpCircle,
} from "lucide-react";
import { PageHero, FAQAccordion } from "@/components/shared";

const prosAndCons = {
  pros: [
    { text: "Privacy and comfort of your own home", icon: Home },
    { text: "Lower cost than clinical procedures", icon: DollarSign },
    { text: "Flexible timing around your schedule", icon: Clock },
    { text: "Relaxed, stress-free environment", icon: Heart },
    { text: "Partner involvement in intimate moment", icon: Shield },
  ],
  cons: [
    { text: "No medical supervision during procedure", icon: AlertTriangle },
    { text: "Success rates may be slightly lower", icon: XCircle },
    { text: "Not suitable for all fertility situations", icon: HelpCircle },
    { text: "State regulations may apply", icon: FileText },
  ],
};

const vialTypes = [
  {
    type: "ICI",
    name: "Intracervical Insemination",
    status: "Recommended for Home",
    description:
      "Unwashed sperm designed for home use. Contains natural seminal fluid. The most popular choice for at-home insemination.",
    price: "$895",
    homeUse: true,
    highlight: true,
  },
  {
    type: "IUI",
    name: "Intrauterine Insemination",
    status: "Can Be Used at Home",
    description:
      "Washed and concentrated sperm. Designed for clinical use but can be used at home with a soft cup method.",
    price: "$995",
    homeUse: true,
    highlight: false,
  },
  {
    type: "ART",
    name: "Assisted Reproductive Technology",
    status: "Clinical Use Only",
    description:
      "Specially prepared for IVF and ICSI procedures. Must be used by a licensed medical professional.",
    price: "$995",
    homeUse: false,
    highlight: false,
  },
];

const processSteps = [
  {
    step: 1,
    title: "Order Vials",
    description:
      "Select ICI or IUI vials and place your order. We recommend ordering at least 2 vials per cycle attempt.",
    details: [
      "Create account and browse donors",
      "Select vial type (ICI recommended)",
      "Choose quantity (2+ per cycle)",
      "Schedule delivery timing",
    ],
  },
  {
    step: 2,
    title: "Receive Shipment",
    description:
      "Your vials arrive in a specialized dry shipper tank that keeps them frozen for up to 7 days.",
    details: [
      "Arrives in secure dry shipper",
      "Vials stay frozen for 7 days",
      "$875 refundable tank deposit",
      "Includes thawing instructions",
    ],
  },
  {
    step: 3,
    title: "Track Ovulation",
    description:
      "Use ovulation predictor kits (OPKs) to identify your fertile window. Timing is crucial for success.",
    details: [
      "Start testing around day 10",
      "Look for LH surge",
      "Inseminate 12-36 hours after surge",
      "Consider basal body temperature tracking",
    ],
  },
  {
    step: 4,
    title: "Thaw Vial",
    description:
      "Remove the vial from the tank and thaw according to our detailed instructions. Handle with care.",
    details: [
      "Remove vial from tank",
      "Thaw at room temperature (20-30 min)",
      "Do NOT use microwave or hot water",
      "Use immediately after thawing",
    ],
  },
  {
    step: 5,
    title: "Inseminate",
    description:
      "Use a needleless syringe to deposit sperm near the cervix. Remain lying down for 15-30 minutes.",
    details: [
      "Lie on back with hips elevated",
      "Insert syringe gently",
      "Deposit sperm slowly",
      "Rest for 15-30 minutes",
    ],
  },
  {
    step: 6,
    title: "Wait & Test",
    description:
      "Wait approximately two weeks before taking a pregnancy test. We're here to support you either way.",
    details: [
      "Wait 14 days post-insemination",
      "Take pregnancy test",
      "Report results to Xytex",
      "Plan next steps if needed",
    ],
  },
];

const shipmentContents = [
  { item: "Dry Shipper Tank", description: "Keeps vials frozen for up to 7 days" },
  { item: "Your Ordered Vials", description: "Securely stored inside the tank" },
  { item: "Thawing Instructions", description: "Step-by-step guide for proper thawing" },
  { item: "Return Shipping Label", description: "Prepaid label for tank return" },
  { item: "Insemination Tips", description: "Guidance for best success rates" },
];

const costBreakdown = [
  { item: "ICI Vial (recommended)", price: "$895", note: "Per vial" },
  { item: "IUI Vial", price: "$995", note: "Per vial" },
  { item: "Overnight Shipping", price: "$350", note: "Continental US" },
  { item: "Tank Deposit", price: "$875", note: "Refundable" },
  { item: "Profile Access", price: "$25", note: "30-day access" },
];

const faqItems = [
  {
    question: "Is at-home insemination legal in my state?",
    answer:
      "At-home insemination is legal in most U.S. states, but regulations vary. Some states require a physician's order or supervision. Contact our team to discuss the requirements in your specific state—we can help you understand your options and ensure compliance with local regulations.",
  },
  {
    question: "What's the success rate of at-home insemination?",
    answer:
      "Success rates vary based on age, fertility health, and timing. Generally, per-cycle success rates for at-home ICI range from 10-20% for women under 35. Clinical IUI may have slightly higher rates due to precise timing and cervical bypass. Most women achieve pregnancy within 3-6 cycles.",
  },
  {
    question: "How do I know when to inseminate?",
    answer:
      "Use ovulation predictor kits (OPKs) starting around cycle day 10. When you detect your LH surge, inseminate within 12-36 hours. Some women also track basal body temperature and cervical mucus for additional indicators. Timing is the most critical factor for success.",
  },
  {
    question: "Can I use IUI vials for at-home insemination?",
    answer:
      "Yes! While IUI vials are designed for clinical intrauterine insemination, they can be used at home with a soft cup method (depositing sperm near the cervix rather than inside the uterus). Some women prefer IUI vials for their concentrated sperm count.",
  },
  {
    question: "How long can the vials stay frozen in the tank?",
    answer:
      "Our dry shipper tanks maintain proper freezing temperatures for up to 7 days. This gives you flexibility to time your insemination around ovulation. The tank does not require electricity or dry ice refills during this period.",
  },
  {
    question: "What happens if I don't get pregnant on the first try?",
    answer:
      "Most women require multiple cycles—3-6 is typical. If your first attempt doesn't succeed, simply order more vials and try again in your next cycle. Our team is here to offer support and guidance. If you don't achieve pregnancy after 6 cycles, we recommend consulting a fertility specialist.",
  },
  {
    question: "How many vials should I order per cycle?",
    answer:
      "We recommend ordering at least 2 vials per cycle to allow for back-to-back inseminations (once at surge detection, once 12-24 hours later). Some women order 3 vials to have a backup in case of thawing issues or for a third insemination attempt.",
  },
  {
    question: "When should I consider going to a clinic instead?",
    answer:
      "Consider clinical treatment if: you're over 38, have known fertility issues (PCOS, endometriosis, blocked tubes), haven't conceived after 6 at-home cycles, or want the higher success rates of IUI or IVF. Your fertility specialist can provide personalized guidance.",
  },
];

export default function AtHomeInseminationPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        eyebrow="At-Home Insemination"
        title="At-Home Insemination:"
        titleHighlight="Privacy, Comfort, Flexibility"
        description="Everything you need to know about at-home insemination with donor sperm. A private, comfortable option for many on their path to parenthood."
        primaryCTA={{ text: "Order for Home Delivery", href: "/browse-donors" }}
        secondaryCTA={{ text: "Questions? Call Us", href: "tel:1-800-277-3210" }}
        trustItems={["7-Day Tank Hold", "50% Buyback", "Free Support"]}
      />

      {/* Is At-Home Right For You */}
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
              Making Your Decision
            </span>
            <h2 className="mt-3 text-navy-900">
              Is At-Home Right For You?
            </h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              At-home insemination offers many benefits, but it&apos;s not for everyone.
              Consider these factors in your decision.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pros */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-green-50 rounded-2xl p-8 border border-green-200"
            >
              <h3 className="text-xl font-heading font-semibold text-green-800 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Advantages
              </h3>
              <ul className="space-y-4">
                {prosAndCons.pros.map((pro) => (
                  <li key={pro.text} className="flex items-start gap-3">
                    <pro.icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-green-900">{pro.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Cons */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-amber-50 rounded-2xl p-8 border border-amber-200"
            >
              <h3 className="text-xl font-heading font-semibold text-amber-800 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Considerations
              </h3>
              <ul className="space-y-4">
                {prosAndCons.cons.map((con) => (
                  <li key={con.text} className="flex items-start gap-3">
                    <con.icon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-900">{con.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Who it works best for */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 max-w-3xl mx-auto bg-cream-50 rounded-2xl p-8 text-center"
          >
            <h3 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Best Candidates for At-Home Insemination
            </h3>
            <p className="text-navy-600 mb-6">
              At-home insemination typically works best for women who are under 38,
              have no known fertility issues, have regular menstrual cycles,
              and are comfortable with the self-administration process.
            </p>
            <Link href="/contact" className="btn btn-secondary">
              <Phone className="w-5 h-5" />
              Discuss Your Options With Us
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Vial Types Explained */}
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
              Understanding Your Options
            </span>
            <h2 className="mt-3 text-navy-900">
              Vial Types Explained
            </h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              Choosing the right vial type is important for at-home success.
              Here&apos;s what you need to know.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {vialTypes.map((vial, index) => (
              <motion.div
                key={vial.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border-2 ${
                  vial.highlight
                    ? "border-gold-400 shadow-lg"
                    : "border-navy-100"
                }`}
              >
                {vial.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-gold-500 text-white text-sm font-medium rounded-full">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <h3 className="text-2xl font-heading font-bold text-navy-900 mb-1">
                    {vial.type}
                  </h3>
                  <p className="text-sm text-navy-500">{vial.name}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-3xl font-heading font-bold text-gold-600">
                    {vial.price}
                  </span>
                  <span className="text-navy-500 text-sm ml-1">per vial</span>
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 w-full justify-center ${
                    vial.homeUse
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {vial.homeUse ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {vial.status}
                </div>

                <p className="text-navy-600 text-sm leading-relaxed">
                  {vial.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-10"
          >
            <Link href="/browse-donors" className="btn btn-primary">
              See Available ICI Vials
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="section-padding bg-navy-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-gold-400 font-medium text-sm uppercase tracking-wider">
              The Process
            </span>
            <h2 className="text-white mt-3">
              Step-by-Step Guide
            </h2>
            <p className="mt-4 text-lg text-navy-300 max-w-2xl mx-auto">
              Follow these steps for the best chance of success with at-home insemination.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 mb-8"
              >
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gold-500 text-navy-900 text-xl font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-navy-800/50 rounded-xl p-6">
                  <h3 className="text-xl font-heading font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-navy-300 mb-4">{step.description}</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center gap-2 text-sm text-navy-400"
                      >
                        <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-10"
          >
            <Link href="/guides/at-home" className="btn btn-outline-gold">
              <Download className="w-5 h-5" />
              Download Printable Instructions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What You'll Receive */}
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
              Your Shipment
            </span>
            <h2 className="mt-3 text-navy-900">
              What You&apos;ll Receive
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-navy-100 to-navy-200 rounded-2xl aspect-square flex items-center justify-center"
            >
              <div className="text-center">
                <Package className="w-24 h-24 text-navy-400 mx-auto mb-4" />
                <p className="text-navy-600 font-medium">
                  Secure Packaging
                </p>
                <p className="text-navy-500 text-sm">
                  Arrives in discreet shipping box
                </p>
              </div>
            </motion.div>

            {/* Contents List */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-heading font-semibold text-navy-900 mb-6">
                Package Contents
              </h3>
              <ul className="space-y-4">
                {shipmentContents.map((content, index) => (
                  <li
                    key={content.item}
                    className="flex items-start gap-4 p-4 bg-cream-50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-navy-900">{content.item}</h4>
                      <p className="text-sm text-navy-600">{content.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <Timer className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">7-Day Hold Time</h4>
                    <p className="text-sm text-amber-800">
                      The dry shipper maintains freezing temperature for 7 days—no
                      electricity or dry ice needed.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cost Breakdown */}
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
              Pricing
            </span>
            <h2 className="mt-3 text-navy-900">
              Cost Breakdown
            </h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              Transparent pricing so you know exactly what to expect.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="p-6 bg-navy-900">
                <h3 className="text-xl font-heading font-semibold text-white text-center">
                  Estimated Cost Per Cycle
                </h3>
              </div>
              <div className="p-6">
                <table className="w-full">
                  <tbody>
                    {costBreakdown.map((item, index) => (
                      <tr
                        key={item.item}
                        className={index !== costBreakdown.length - 1 ? "border-b border-navy-100" : ""}
                      >
                        <td className="py-4">
                          <span className="font-medium text-navy-900">{item.item}</span>
                          <span className="block text-sm text-navy-500">{item.note}</span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-lg font-semibold text-navy-900">
                            {item.price}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 pt-6 border-t-2 border-navy-900">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-navy-900">
                      Typical First Cycle Total
                    </span>
                    <span className="text-2xl font-heading font-bold text-gold-600">
                      $3,040 - $3,240
                    </span>
                  </div>
                  <p className="text-sm text-navy-500 mt-2">
                    Based on 2 ICI vials. Tank deposit refunded upon return.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mt-8"
            >
              <Link href="/pricing" className="btn btn-primary">
                See Full Pricing Details
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              Common Questions
            </span>
            <h2 className="mt-3 text-navy-900">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>
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
              Ready to Begin{" "}
              <span className="text-gradient">At Home?</span>
            </h2>
            <p className="text-xl text-navy-200 mb-10">
              Browse our donors and start your at-home insemination journey today.
              We&apos;re here to support you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse-donors" className="btn btn-primary text-base px-8 py-4">
                Browse Donors
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="btn btn-white text-base px-8 py-4">
                <Phone className="w-5 h-5" />
                Free Consultation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

