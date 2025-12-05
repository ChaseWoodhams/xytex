"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Calendar,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  Phone,
  Download,
  UserCheck,
  Baby,
  Warehouse,
  FileText,
  MessageCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import { PageHero, FAQAccordion } from "@/components/shared";

const considerations = [
  {
    icon: Heart,
    title: "Is This Right For Me?",
    questions: [
      "Am I ready to be a single parent?",
      "Do I have a support system in place?",
      "Have I considered how I'll talk to my child about their origins?",
      "Am I emotionally prepared for this journey?",
    ],
  },
  {
    icon: DollarSign,
    title: "Financial Considerations",
    questions: [
      "Can I afford the initial costs of donor sperm and procedures?",
      "Have I budgeted for childcare as a single parent?",
      "Do I have emergency savings?",
      "Have I explored financing options?",
    ],
  },
  {
    icon: Clock,
    title: "Timeline Expectations",
    questions: [
      "How long might it take to conceive?",
      "Am I prepared for multiple cycles if needed?",
      "Have I discussed timing with my healthcare provider?",
      "Do I understand my fertility timeline?",
    ],
  },
];

const timeline = [
  {
    month: "Month 1",
    title: "Research & Select Donor",
    description:
      "Browse donor profiles, review medical histories, and choose your ideal match. Take advantage of our 7-day free trial.",
    icon: FileText,
  },
  {
    month: "Month 2",
    title: "Order Vials & Schedule",
    description:
      "Purchase vials, coordinate with your clinic or prepare for at-home insemination, and schedule your procedure.",
    icon: Calendar,
  },
  {
    month: "Month 3+",
    title: "Insemination Cycles",
    description:
      "Begin your insemination journey. Most women try 3-6 cycles. Track ovulation and stay connected with your care teamotion.",
    icon: Heart,
  },
  {
    month: "Success!",
    title: "Pregnancy",
    description:
      "Celebrate your positive test! We're here to support you through pregnancy and beyond. Report your birth to us!",
    icon: Baby,
  },
];

const benefits = [
  {
    icon: UserCheck,
    title: "Identity Disclosure Matters",
    description:
      "55.6% of SMBCs prefer identity disclosure. All our donors since 2017 are identity disclosed, giving your child the option to connect at 18.",
    stat: "55.6%",
    statLabel: "prefer ID disclosure",
  },
  {
    icon: Shield,
    title: "Select Without Partner Input",
    description:
      "Choose traits that matter to you—ethnicity, education, interests, personality. Our detailed profiles help you find your ideal match.",
  },
  {
    icon: Users,
    title: "Plan for Future Siblings",
    description:
      "Many SMBCs want siblings from the same donor. Purchase extra vials upfront with free storage for up to 3 years.",
  },
];

const siblingPlanning = [
  {
    title: "Why Buy Extra Vials?",
    points: [
      "Guarantee same donor for future siblings",
      "Donors can retire at any time",
      "Popular donors sell out quickly",
      "Locks in today's pricing",
    ],
  },
  {
    title: "Our Storage Benefits",
    points: [
      "Free storage for 1 year with 4+ vials",
      "Free storage for 3 years with 8+ vials",
      "50% buyback on unused vials",
      "Flexible storage extensions available",
    ],
  },
];

const communityResources = [
  {
    title: "Single Mothers by Choice (SMC)",
    description: "National organization supporting single women choosing motherhood",
    link: "https://www.singlemothersbychoice.org",
  },
  {
    title: "Choice Moms",
    description: "Resources, podcasts, and community for choice mothers",
    link: "https://www.choicemoms.org",
  },
  {
    title: "Donor Sibling Registry",
    description: "Connect with half-siblings and donor-conceived families",
    link: "https://www.donorsiblingregistry.com",
  },
];

const faqItems = [
  {
    question: "How do I know if becoming an SMBC is right for me?",
    answer:
      "This is a deeply personal decision. Consider your emotional readiness, financial stability, support system, and desire for parenthood. Many women find it helpful to speak with a counselor who specializes in fertility decisions, connect with other SMBCs, and thoroughly research the process before committing.",
  },
  {
    question: "What's the average cost to become a single mother by choice?",
    answer:
      "Costs vary widely depending on your approach. Donor sperm typically costs $800-$1,200 per vial. IUI procedures range from $300-$1,000 per cycle. IVF costs $12,000-$25,000 per cycle. Most women budget for 3-6 IUI cycles before considering IVF. Our financing options through CapexMD can help make this more manageable.",
  },
  {
    question: "How many vials should I purchase?",
    answer:
      "We recommend purchasing at least 2-3 vials per anticipated cycle, plus extra for future siblings if desired. Many SMBCs purchase 6-12 vials to ensure the same donor is available for multiple children. Our free storage (1-3 years) and 50% buyback program reduce the financial risk.",
  },
  {
    question: "Should I tell my child about their donor?",
    answer:
      "Research strongly supports early, age-appropriate disclosure. Children told early tend to have healthier adjustment than those told later or who discover accidentally. Our identity-disclosed donors support this openness, and we provide resources on talking to your child about their origins.",
  },
  {
    question: "Can I do at-home insemination as a single woman?",
    answer:
      "In most states, yes. At-home insemination with ICI (unwashed) vials is an option for many SMBCs. It offers privacy, lower cost, and comfort in your own home. However, success rates may be slightly lower than clinical IUI. Check your state's requirements, as some mandate physician involvement.",
  },
  {
    question: "How do I build a support system as a single parent?",
    answer:
      "Many SMBCs find support through: local and online SMBC groups, friends and family, single parent meetups, hired help (nannies, doulas, mother's helpers), and their workplace community. Building this network before pregnancy can make the transition to parenthood smoother.",
  },
];

export default function SingleMotherByChoicePage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        eyebrow="Single Mothers by Choice"
        title="Your Family. Your Timeline."
        titleHighlight="Your Terms."
        description="Join thousands of empowered women who have chosen motherhood on their own path. Xytex has helped single mothers by choice build their families since 1975."
        primaryCTA={{ text: "Start Your Journey", href: "/browse-donors" }}
        secondaryCTA={{ text: "Talk to Someone", href: "/contact" }}
        trustItems={["Fastest-Growing Family Type", "Identity Disclosed", "Free Genetic Counseling"]}
      />

      {/* Is This Right For Me Section */}
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
              Before You Begin
            </span>
            <h2 className="mt-3 text-navy-900">
              Is This Right For Me?
            </h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              Becoming a single mother by choice is a significant decision.
              Here are some questions many women consider.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {considerations.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-cream-50 rounded-2xl p-8 border border-cream-200"
              >
                <div className="w-14 h-14 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-gold-400" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  {item.title}
                </h3>
                <ul className="space-y-3">
                  {item.questions.map((question) => (
                    <li key={question} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
                      <span className="text-navy-600 text-sm">{question}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link href="/contact" className="btn btn-primary">
              <MessageCircle className="w-5 h-5" />
              Free SMBC Consultation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Donor Selection for SMBCs */}
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
              Your Donor Selection
            </span>
            <h2 className="mt-3 text-navy-900">
              Choosing a Donor as a Single Woman
            </h2>
            <div className="divider-gold mx-auto mt-6" />
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col md:flex-row gap-8 items-center mb-12 ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-navy-900">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-navy-600 leading-relaxed">
                    {benefit.description}
                  </p>
                  {benefit.stat && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gold-100 rounded-full">
                      <Sparkles className="w-4 h-4 text-gold-600" />
                      <span className="text-gold-800 font-medium">
                        {benefit.stat} {benefit.statLabel}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-full md:w-64 h-48 bg-gradient-to-br from-gold-100 to-cream-200 rounded-2xl flex items-center justify-center">
                  <benefit.icon className="w-20 h-20 text-gold-400/50" />
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-8"
            >
              <Link href="/browse-donors" className="btn btn-primary">
                Browse Identity Disclosed Donors
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
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
              Your SMBC Journey
            </h2>
            <p className="mt-4 text-lg text-navy-300 max-w-2xl mx-auto">
              Here&apos;s what your path to motherhood might look like.
              Every journey is unique, but this gives you an idea of the process.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gold-500/30 -translate-x-1/2" />

            {timeline.map((step, index) => (
              <motion.div
                key={step.month}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`relative flex items-center gap-8 mb-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline Node */}
                <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-gold-500 -translate-x-1/2 ring-4 ring-navy-900" />

                {/* Content */}
                <div
                  className={`flex-1 ml-20 md:ml-0 ${
                    index % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"
                  }`}
                >
                  <span className="text-gold-400 text-sm font-medium">
                    {step.month}
                  </span>
                  <h3 className="text-xl font-heading font-semibold text-white mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-navy-300">{step.description}</p>
                </div>

                {/* Icon */}
                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-navy-800 items-center justify-center">
                  <step.icon className="w-8 h-8 text-gold-400" />
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sibling Planning Section */}
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
              Planning Ahead
            </span>
            <h2 className="mt-3 text-navy-900">
              Planning for Future Siblings
            </h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              Many SMBCs want the option of future children from the same donor.
              Here&apos;s how to plan ahead.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {siblingPlanning.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-cream-50 rounded-2xl p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                  <Warehouse className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold-500 flex-shrink-0" />
                      <span className="text-navy-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link href="/contact" className="btn btn-secondary">
              <Phone className="w-5 h-5" />
              Talk to Us About Multi-Vial Discounts
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Support & Community Section */}
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
              You&apos;re Not Alone
            </span>
            <h2 className="mt-3 text-navy-900">
              Support & Community
            </h2>
            <p className="mt-4 text-lg text-navy-600 max-w-2xl mx-auto">
              Connect with other single mothers by choice and find the support
              you need for this journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {communityResources.map((resource, index) => (
              <motion.a
                key={resource.title}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="block bg-white rounded-xl p-6 border border-navy-100 hover:border-gold-300 hover:shadow-lg transition-all group"
              >
                <h3 className="text-lg font-heading font-semibold text-navy-900 group-hover:text-gold-700 transition-colors mb-2">
                  {resource.title}
                </h3>
                <p className="text-navy-600 text-sm mb-4">{resource.description}</p>
                <span className="text-gold-600 text-sm font-medium flex items-center gap-1">
                  Visit Site
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.a>
            ))}
          </div>

          {/* Lead Magnet */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-navy-900 rounded-2xl p-8 md:p-10 text-center">
              <Download className="w-12 h-12 text-gold-400 mx-auto mb-4" />
              <h3 className="text-2xl font-heading font-semibold text-white mb-3">
                Download Our Free SMBC Guide
              </h3>
              <p className="text-navy-300 mb-6">
                A comprehensive guide covering everything from choosing a donor
                to talking to your child about their origins.
              </p>
              <Link href="/guides/smbc" className="btn btn-primary">
                Download Free Guide
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
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
              Ready to Write{" "}
              <span className="text-gradient">Your Story?</span>
            </h2>
            <p className="text-xl text-navy-200 mb-10">
              Thousands of women have chosen to become mothers on their own
              terms. Your journey starts with a single step.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse-donors" className="btn btn-primary text-base px-8 py-4">
                Browse Donors
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="btn btn-white text-base px-8 py-4">
                <Calendar className="w-5 h-5" />
                Schedule Consultation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

