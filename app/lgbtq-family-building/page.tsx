"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Users,
  User,
  Baby,
  Shield,
  Camera,
  Dna,
  Clock,
  Scale,
  Phone,
  Calendar,
  UserPlus,
  Search,
  Truck,
  FileText,
  CheckCircle2,
  Warehouse,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { PageHero, FAQAccordion } from "@/components/shared";

const pathways = [
  {
    id: "carrying",
    title: "Carrying Your Pregnancy",
    for: "Anyone who plans to carry a pregnancy themselves—whether you're partnered or solo.",
    options: [
      {
        title: "IUI (Intrauterine Insemination)",
        description:
          "A simple procedure where donor sperm is placed directly in the uterus, timed with ovulation. Can be done at a clinic or, in many states, at home.",
      },
      {
        title: "IVF (In Vitro Fertilization)",
        description:
          "Eggs are retrieved, fertilized with donor sperm in a lab, and the embryo is transferred. Often recommended after multiple IUI cycles or for specific medical situations.",
      },
      {
        title: "At-Home Insemination",
        description:
          "In many states, you can order ICI vials shipped directly to your home.",
        link: "/at-home-insemination",
        linkText: "Learn more about at-home options",
      },
    ],
    planningNote:
      "Planning together? If you have a partner who isn't carrying, you can browse donors together, discuss traits that matter to both of you, and make this decision as a team. Our 7-day free profile access gives you time to explore without pressure.",
    ctas: [
      { text: "Browse Donors", href: "/browse-donors" },
      { text: "At-Home Insemination Guide", href: "/at-home-insemination" },
    ],
  },
  {
    id: "reciprocal",
    title: "Reciprocal IVF",
    for: "Partners who both want a biological connection to your child.",
    howItWorks: [
      "One partner provides the egg, and the other carries the pregnancy.",
      "The donor sperm fertilizes the egg, creating an embryo that's transferred to the carrying partner.",
    ],
    whatItMeans: [
      "One partner is the genetic parent",
      "One partner is the gestational (birth) parent",
      "Both share a biological bond with your child",
    ],
    whatYouNeed: [
      "A fertility clinic that offers reciprocal IVF",
      "Egg retrieval from one partner",
      "Embryo transfer to the other partner",
      "Donor sperm from Xytex",
    ],
    whyChoose:
      "Reciprocal IVF allows both partners to participate physically in creating your family. Many couples find this deeply meaningful.",
    ctas: [
      { text: "Browse Donors", href: "/browse-donors" },
      { text: "Find a Fertility Clinic Near You", href: "/contact" },
    ],
  },
  {
    id: "surrogacy",
    title: "Using a Gestational Carrier or Surrogate",
    for: "Anyone who needs or chooses to have someone else carry the pregnancy.",
    options: [
      {
        title: "Gestational Surrogacy",
        description:
          "An embryo (created with your egg/sperm or donor gametes) is carried by a gestational carrier who has no genetic connection to the child.",
      },
      {
        title: "Traditional Surrogacy",
        description:
          "The surrogate provides the egg and carries the pregnancy. Less common due to legal complexity.",
      },
    ],
    whatXytexProvides:
      "We supply the donor sperm. You'll work with a surrogacy agency or independent surrogate, plus a fertility clinic to coordinate the process.",
    keyConsiderations: [
      "Surrogacy laws vary significantly by state",
      "Costs typically range from $100,000-$200,000+ total",
      "We can ship directly to your surrogate's fertility clinic anywhere in the U.S.",
    ],
    ctas: [
      { text: "Browse Donors", href: "/browse-donors" },
      { text: "Learn About Surrogacy Coordination", href: "/contact" },
    ],
  },
  {
    id: "known-donor",
    title: "Known Donor vs. Sperm Bank",
    for: "Anyone weighing whether to use a known donor (friend/family) or a sperm bank.",
    comparison: {
      spermBank: [
        "Comprehensive health & genetic screening (569 tests at Xytex)",
        "Clear legal boundaries—donor has no parental rights",
        "Identity disclosure when child turns 18 (if desired)",
        "Consistent availability for future siblings",
        "No existing relationship to navigate",
      ],
      knownDonor: [
        "Screening is your responsibility",
        "Requires legal contracts; can be contested",
        "Relationship dynamics may complicate things",
        "Availability depends on the person",
        "Existing relationship adds complexity",
      ],
    },
    recommendation:
      "If you're considering a known donor, consult with a reproductive attorney first. If you choose a sperm bank, you get medical confidence and legal clarity.",
    ctas: [
      { text: "Browse Our Donors", href: "/browse-donors" },
      { text: "Download Known Donor Comparison Guide", href: "/contact" },
    ],
  },
  {
    id: "single",
    title: "Single & LGBTQ+",
    for: "Individuals building a family on your own.",
    description:
      "You don't need a partner to become a parent. Single parents by choice are one of our fastest-growing family types, and we support you fully.",
    cta: { text: "Visit our Single Parents page", href: "/single-mother-by-choice" },
  },
];

const differentiators = [
  {
    icon: UserCheck,
    title: "100% Identity Disclosed Donors",
    whatItMeans:
      "Every donor in our current program has agreed to let their identifying information be shared with donor-conceived individuals when they turn 18.",
    whyItMatters:
      "Research shows that many donor-conceived people want to know their genetic origins. Identity disclosure gives your child the option to connect—it doesn't require it, but it keeps the door open.",
    testimonial: {
      quote:
        "We wanted our daughter to have the choice to learn about her donor someday. That mattered to us more than anything else.",
      author: "Jamie",
      location: "Portland",
    },
  },
  {
    icon: Camera,
    title: "Baby AND Adult Photos",
    whatItMeans:
      "Unlike many sperm banks that only show childhood photos, we provide both baby photos and photos of donors as adults.",
    whyItMatters:
      "You can see who your child may resemble not just as a baby, but as they grow up. For many LGBTQ+ families where the child won't share genetics with both parents, this visibility is especially meaningful.",
  },
  {
    icon: Dna,
    title: "569 Genetic Conditions Tested",
    whatItMeans:
      "Through our partnership with Invitae, every donor is screened for 569 genetic conditions—one of the most comprehensive panels in the industry.",
    whyItMatters:
      "Peace of mind. You'll receive a detailed genetic report for your donor, and our team offers complimentary consultations with genetic counselors to help you understand the results.",
  },
  {
    icon: Clock,
    title: "50 Years of Trust",
    whatItMeans: "Founded in 1975, Xytex is America's longest-running sperm bank.",
    whyItMatters:
      "We've been here through decades of change—supporting families when others wouldn't. Our experience means we've seen every situation, answered every question, and refined our processes over 50 years.",
  },
  {
    icon: Heart,
    title: "No Judgment. Ever.",
    whatItMeans:
      "Your family structure is celebrated here, not just tolerated. Our team is trained to support all paths to parenthood without assumptions.",
    whatYouWontHear: [
      "Which one of you is the mom/dad?",
      "Who's the real parent?",
      "Assumptions about your anatomy, identity, or relationship",
    ],
    whatYouWillHear: [
      "How can we support your specific journey?",
      "Here are all your options—you decide what's right.",
    ],
  },
];

const legalTopics = [
  {
    title: "Establishing Parentage",
    challenge:
      "In many states, the non-biological or non-gestational parent isn't automatically recognized as a legal parent.",
    solutions: [
      "Some states allow both parents on the birth certificate without adoption",
      "Some states require second-parent adoption for the non-bio parent",
      "Some states have unclear or hostile laws for LGBTQ+ families",
    ],
    recommendation:
      "Consult with an LGBTQ+ family law attorney in your state before you begin the process. This is not optional—it's essential.",
  },
  {
    title: "Donor Parental Rights",
    goodNews:
      "When you use a licensed sperm bank like Xytex, the donor has no parental rights to your child. This is legally clear and well-established.",
    complexity:
      "If you use a known donor without proper legal documentation, parental rights can become contested—even years later.",
    whySpermBanks:
      "Our donors sign legal agreements relinquishing all parental rights. This protects your family.",
  },
  {
    title: "State-Specific Considerations",
    strongProtections: [
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New York",
      "Oregon",
      "Rhode Island",
      "Vermont",
      "Washington, D.C.",
    ],
    note: "Many other states have complex or evolving laws—we strongly recommend legal consultation regardless of where you live.",
    coloradoNote:
      "Colorado note (2025): New Donor-Conceived Persons Protection Act requirements took effect.",
  },
];

const futurePlanning = [
  {
    title: "Siblings from the Same Donor",
    whyItMatters:
      "Many families want biological siblings to share the same donor. But popular donors sell out—sometimes quickly.",
    howToPlan: [
      "Purchase extra vials during your first order",
      "Store them at Xytex for future use",
      "Use our 50% Vial Buyback if you don't need them",
    ],
    storageIncentives: [
      "4-7 vials → 1 year FREE storage",
      "8+ vials → 3 years FREE storage",
    ],
    testimonial: {
      quote:
        "We bought 8 vials upfront. Our first child took 3 cycles. We had 5 left for her brother, conceived 2 years later. Same donor, no stress.",
      author: "Alex & Jordan",
    },
  },
  {
    title: "Costs to Expect",
    items: [
      { item: "Donor sperm vial (ICI/IUI)", cost: "$1,200 - $1,800 per vial" },
      { item: "Shipping", cost: "$200 - $350" },
      { item: "Tank deposit (refundable)", cost: "$875" },
      { item: "Profile access", cost: "Free 7-day trial, then $75/30 days" },
    ],
    note: "Not included: Fertility clinic fees, IVF costs, surrogacy costs (if applicable)",
    financing: "Financing available through our partnership with CapexMD.",
  },
];

const testimonials = [
  {
    quote:
      "We went through 4 IUI cycles before our daughter arrived. Through all of it, Xytex was patient, supportive, and never made us feel like just a transaction. When we called to order vials for baby #2, they remembered us. That meant everything.",
    author: "Sarah & Emma",
    location: "Seattle, WA",
    type: "Two moms via IUI",
  },
  {
    quote:
      "As a trans man, I wasn't sure how I'd be treated when I called to ask questions about carrying a pregnancy. The Xytex team was knowledgeable, respectful, and didn't skip a beat. They made me feel like they'd helped hundreds of people like me—because they have.",
    author: "Marcus",
    location: "Austin, TX",
    type: "Trans dad, carried his own pregnancy",
  },
  {
    quote:
      "Coordinating donor sperm with our surrogate's clinic in another state felt overwhelming at first. Xytex handled the shipping logistics seamlessly and kept us informed every step of the way. Our son is now 18 months old.",
    author: "Michael & David",
    location: "San Francisco, CA",
    type: "Two dads via gestational surrogacy",
  },
  {
    quote:
      "I'm a single queer woman who always knew I wanted to be a mom. Xytex never made me feel like I needed a partner to deserve good service. They treated my family-building goals with the same respect as anyone else's.",
    author: "Riley",
    location: "Denver, CO",
    type: "Single parent by choice",
  },
];

const faqItems = [
  {
    question: "Do I need a physician to order donor sperm?",
    answer:
      "It depends on your state and your plan. At-home insemination: Many states allow you to order directly without a physician. Some states require physician involvement. Clinic-based IUI/IVF: Your fertility clinic will place the order or coordinate with us. Our team can help you understand the specific requirements for your location.",
  },
  {
    question: "Can my partner and I both be involved in the process?",
    answer:
      "Absolutely. You can browse donors together using shared account access, both attend our free consultations, both be listed on your account and communications, and make decisions as a team at your own pace. We don't make assumptions about who's 'in charge' of your family building.",
  },
  {
    question: "What is reciprocal IVF and how does it work?",
    answer:
      "Reciprocal IVF allows two partners to both have a biological connection to your child: Partner A undergoes egg retrieval (eggs are collected), donor sperm fertilizes the eggs to create embryos, and Partner B carries the pregnancy via embryo transfer. The result: One partner is genetically connected, one is the birth parent. Both share a biological role. Requirements: A fertility clinic that offers this procedure, plus donor sperm from Xytex.",
  },
  {
    question: "How can we ensure the same donor for future siblings?",
    answer:
      "Plan ahead and purchase extra vials. Popular donors sell out—sometimes within months. The only way to guarantee access is to buy and store additional vials during your first purchase. 4-7 vials: 1 year free storage + 50% buyback on unused vials. 8+ vials: 3 years free storage + 50% buyback. Don't wait until you're ready for baby #2 to discover your donor is no longer available.",
  },
  {
    question: "Are your donors comfortable with LGBTQ+ families?",
    answer:
      "Yes. All current Xytex donors understand that their donations may be used by families of all types—including LGBTQ+ couples and individuals. Our identity disclosure program also means donors have agreed to potential future contact with donor-conceived individuals, signaling openness and comfort with the process.",
  },
  {
    question: "What if I have questions about my specific situation?",
    answer:
      "We're here for exactly that. Every family's journey is different. Our client services team offers free consultations to discuss your specific circumstances—whether that's navigating state laws, understanding your options, or figuring out logistics.",
  },
];

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Free Account",
    description:
      "Sign up in 2 minutes and get 7-day free access to browse all donor profiles—including baby photos, adult photos, essays, and medical histories.",
  },
  {
    number: "02",
    icon: Search,
    title: "Explore Donors on Your Terms",
    description:
      "Take your time. Browse solo or with your partner. Filter by traits that matter to you. Read donor essays to get a sense of personality.",
  },
  {
    number: "03",
    icon: Calendar,
    title: "Schedule a Free Consultation",
    description:
      "Have questions? Our team offers complimentary Zoom consultations to discuss your specific situation—no pressure, no sales pitch.",
  },
  {
    number: "04",
    icon: Truck,
    title: "Order When You're Ready",
    description:
      "Select your vials, choose your shipping method (to clinic or home in most states), and we'll handle the rest. Need help coordinating with your clinic? We do that too.",
  },
];

export default function LGBTQFamilyBuildingPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        eyebrow="LGBTQ+ Family Building"
        title="Your Family."
        titleHighlight="Your Journey. Your Way."
        description="Xytex has proudly supported LGBTQ+ families for 50 years. However your family looks, whatever your path to parenthood—we're honored to be part of your journey."
        primaryCTA={{
          text: "Browse Donors Free for 7 Days",
          href: "/browse-donors",
        }}
        secondaryCTA={{
          text: "Schedule Free Consultation",
          href: "/contact",
        }}
        trustItems={[
          "50 Years Experience",
          "100% Identity Disclosed",
          "569 Genetic Tests",
          "Shipped to 35+ Countries",
        ]}
      />

      {/* Section 1: Pathways to Parenthood */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-navy-900 mb-4">Find Your Path</h2>
            <p className="text-lg text-navy-700 max-w-3xl mx-auto leading-relaxed">
              Every family-building journey is unique. Rather than tell you what
              your path should look like, we're here to support the one you
              choose. Explore the options below, or{" "}
              <Link
                href="/contact"
                className="text-gold-600 font-semibold hover:text-gold-700 transition-colors animated-underline"
              >
                talk to our team
              </Link>{" "}
              for personalized guidance.
            </p>
          </motion.div>

          {/* Pathway Cards */}
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Pathway 1: Carrying Your Pregnancy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {pathways[0] && (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
                      {pathways[0].title}
                    </h3>
                    <p className="text-navy-700 font-medium">
                      <strong>For:</strong> {pathways[0].for}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-4">
                      <strong>Your options include:</strong>
                    </p>
                    <div className="space-y-4">
                      {pathways[0].options?.map((option, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-gold-400">
                          <h4 className="font-semibold text-navy-900 mb-1">
                            {option.title}
                          </h4>
                          <p className="text-navy-700 text-sm leading-relaxed">
                            {option.description}
                            {'link' in option && option.link && (
                              <>
                                {" "}
                                <Link
                                  href={option.link}
                                  className="text-gold-600 font-semibold hover:text-gold-700 transition-colors"
                                >
                                  {option.linkText} →
                                </Link>
                              </>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pathways[0].planningNote && (
                    <div className="bg-white/50 rounded-lg p-4 mb-6">
                      <p className="text-navy-700 text-sm leading-relaxed">
                        {pathways[0].planningNote}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {pathways[0].ctas?.map((cta, idx) => (
                      <Link
                        key={idx}
                        href={cta.href}
                        className="btn btn-secondary text-sm px-6 py-2.5"
                      >
                        {cta.text}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Pathway 2: Reciprocal IVF */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {pathways[1] && (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
                      {pathways[1].title}
                    </h3>
                    <p className="text-navy-700 font-medium">
                      <strong>For:</strong> {pathways[1].for}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-3">
                      <strong>How it works:</strong>
                    </p>
                    <p className="text-navy-700 mb-4 leading-relaxed">
                      {pathways[1].howItWorks?.[0]} {pathways[1].howItWorks?.[1]} This
                      means:
                    </p>
                    <ul className="space-y-2 mb-4">
                      {pathways[1].whatItMeans?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-navy-700">
                          <CheckCircle2 className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-3">
                      <strong>What you'll need:</strong>
                    </p>
                    <ul className="space-y-2">
                      {pathways[1].whatYouNeed?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-navy-700">
                          <CheckCircle2 className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/50 rounded-lg p-4 mb-6">
                    <p className="text-navy-700 text-sm leading-relaxed">
                      <strong>Why families choose this:</strong>{" "}
                      {pathways[1].whyChoose}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {pathways[1].ctas?.map((cta, idx) => (
                      <Link
                        key={idx}
                        href={cta.href}
                        className="btn btn-secondary text-sm px-6 py-2.5"
                      >
                        {cta.text}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Pathway 3: Using a Gestational Carrier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {pathways[2] && (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
                      {pathways[2].title}
                    </h3>
                    <p className="text-navy-700 font-medium">
                      <strong>For:</strong> {pathways[2].for}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-4">
                      <strong>Your options include:</strong>
                    </p>
                    <div className="space-y-4">
                      {pathways[2].options?.map((option, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-gold-400">
                          <h4 className="font-semibold text-navy-900 mb-1">
                            {option.title}
                          </h4>
                          <p className="text-navy-700 text-sm leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-2">
                      <strong>What Xytex provides:</strong>
                    </p>
                    <p className="text-navy-700 text-sm leading-relaxed">
                      {pathways[2].whatXytexProvides}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-3">
                      <strong>Key considerations:</strong>
                    </p>
                    <ul className="space-y-2">
                      {pathways[2].keyConsiderations?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-navy-700">
                          <CheckCircle2 className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {pathways[2].ctas?.map((cta, idx) => (
                      <Link
                        key={idx}
                        href={cta.href}
                        className="btn btn-secondary text-sm px-6 py-2.5"
                      >
                        {cta.text}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Pathway 4: Known Donor vs. Sperm Bank */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {pathways[3] && (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
                      {pathways[3].title}
                    </h3>
                    <p className="text-navy-700 font-medium">
                      <strong>For:</strong> {pathways[3].for}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-4">
                      <strong>Why families choose a sperm bank:</strong>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gold-400">
                            <th className="text-left py-3 px-4 font-semibold text-navy-900">
                              Sperm Bank
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-navy-900">
                              Known Donor
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pathways[3].comparison?.spermBank?.map((item, idx) => (
                            <tr key={idx} className="border-b border-cream-200">
                              <td className="py-3 px-4 text-navy-700">
                                <CheckCircle2 className="w-4 h-4 text-gold-500 inline mr-2" />
                                {item}
                              </td>
                              <td className="py-3 px-4 text-navy-600">
                                {pathways[3].comparison?.knownDonor?.[idx]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-lg p-4 mb-6">
                    <p className="text-navy-700 text-sm leading-relaxed">
                      <strong>Our recommendation:</strong>{" "}
                      {pathways[3].recommendation}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {pathways[3].ctas?.map((cta, idx) => (
                      <Link
                        key={idx}
                        href={cta.href}
                        className="btn btn-secondary text-sm px-6 py-2.5"
                      >
                        {cta.text}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Pathway 5: Single & LGBTQ+ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {pathways[4] && (
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-2">
                      {pathways[4].title}
                    </h3>
                    <p className="text-navy-700 font-medium mb-4">
                      <strong>For:</strong> {pathways[4].for}
                    </p>
                    <p className="text-navy-700 mb-6 leading-relaxed">
                      {pathways[4].description}
                    </p>
                    {pathways[4].cta && (
                      <Link
                        href={pathways[4].cta.href}
                        className="btn btn-secondary text-sm px-6 py-2.5 inline-flex items-center gap-2"
                      >
                        {pathways[4].cta.text} →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: Why LGBTQ+ Families Choose Xytex */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-navy-900 mb-4">The Xytex Difference</h2>
            <p className="text-lg text-navy-700 max-w-3xl mx-auto leading-relaxed">
              We've supported LGBTQ+ families since 1975—long before it was
              common or easy. Here's why families continue to choose us.
            </p>
          </motion.div>

          <div className="space-y-8 max-w-5xl mx-auto">
            {differentiators.map((diff, index) => (
              <motion.div
                key={diff.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 lg:p-10 border border-cream-200 shadow-sm"
              >
                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                    <diff.icon className="w-8 h-8 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-3">
                      {diff.title}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-navy-700 font-medium mb-1">
                          <strong>What it means:</strong>
                        </p>
                        <p className="text-navy-700 leading-relaxed">
                          {diff.whatItMeans}
                        </p>
                      </div>
                      <div>
                        <p className="text-navy-700 font-medium mb-1">
                          <strong>Why it matters for your family:</strong>
                        </p>
                        <p className="text-navy-700 leading-relaxed">
                          {diff.whyItMatters}
                        </p>
                      </div>
                      {diff.testimonial && (
                        <div className="bg-cream-50 rounded-lg p-4 mt-4 border-l-4 border-gold-400">
                          <p className="text-navy-700 italic mb-2">
                            &ldquo;{diff.testimonial.quote}&rdquo;
                          </p>
                          <p className="text-sm text-navy-600">
                            — {diff.testimonial.author}
                            {diff.testimonial.location && `, ${diff.testimonial.location}`}
                          </p>
                        </div>
                      )}
                      {diff.whatYouWontHear && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-navy-700 font-medium mb-2">
                              <strong>What you won't hear from us:</strong>
                            </p>
                            <ul className="space-y-1">
                              {diff.whatYouWontHear.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-navy-700 text-sm"
                                >
                                  <span className="text-red-500">×</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-navy-700 font-medium mb-2">
                              <strong>What you will hear:</strong>
                            </p>
                            <ul className="space-y-1">
                              {diff.whatYouWillHear.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-navy-700 text-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Legal Considerations */}
      <section className="section-padding bg-navy-900">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Scale className="w-12 h-12 text-gold-400 mx-auto mb-4" />
              <h2 className="text-white mb-4">Navigating the Legal Landscape</h2>
              <p className="text-navy-200 text-lg leading-relaxed max-w-3xl mx-auto">
                LGBTQ+ family law varies dramatically by state—and it's evolving
                constantly. Understanding your legal landscape is essential to
                protecting your family.
              </p>
            </motion.div>

            <div className="space-y-8">
              {legalTopics.map((topic, index) => (
                <motion.div
                  key={topic.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-navy-800/50 rounded-2xl p-8 border border-navy-700"
                >
                  <h3 className="text-2xl font-heading font-semibold text-white mb-4">
                    {topic.title}
                  </h3>
                  {topic.challenge && (
                    <div className="mb-4">
                      <p className="text-navy-200 font-medium mb-2">
                        <strong>The challenge:</strong>
                      </p>
                      <p className="text-navy-200 leading-relaxed">
                        {topic.challenge}
                      </p>
                    </div>
                  )}
                  {topic.solutions && (
                    <div className="mb-4">
                      <p className="text-navy-200 font-medium mb-2">
                        <strong>Solutions vary by state:</strong>
                      </p>
                      <ul className="space-y-2">
                        {topic.solutions.map((solution, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-navy-200"
                          >
                            <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {topic.goodNews && (
                    <div className="mb-4">
                      <p className="text-navy-200 font-medium mb-2">
                        <strong>The good news:</strong>
                      </p>
                      <p className="text-navy-200 leading-relaxed">
                        {topic.goodNews}
                      </p>
                    </div>
                  )}
                  {topic.complexity && (
                    <div className="mb-4">
                      <p className="text-navy-200 font-medium mb-2">
                        <strong>The complexity:</strong>
                      </p>
                      <p className="text-navy-200 leading-relaxed">
                        {topic.complexity}
                      </p>
                    </div>
                  )}
                  {topic.whySpermBanks && (
                    <div className="mb-4">
                      <p className="text-navy-200 font-medium mb-2">
                        <strong>Why sperm banks provide clarity:</strong>
                      </p>
                      <p className="text-navy-200 leading-relaxed">
                        {topic.whySpermBanks}
                      </p>
                    </div>
                  )}
                  {topic.strongProtections && (
                    <div className="mb-4">
                      <p className="text-navy-200 font-medium mb-2">
                        <strong>States with strong LGBTQ+ family protections:</strong>
                      </p>
                      <p className="text-navy-200 leading-relaxed">
                        {topic.strongProtections.join(", ")}
                      </p>
                    </div>
                  )}
                  {topic.note && (
                    <div className="mb-4">
                      <p className="text-navy-200 leading-relaxed">
                        {topic.note}
                      </p>
                    </div>
                  )}
                  {topic.coloradoNote && (
                    <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-4 mt-4">
                      <p className="text-gold-300 text-sm leading-relaxed">
                        <strong>{topic.coloradoNote}</strong>{" "}
                        <Link
                          href="/contact"
                          className="text-gold-200 hover:text-gold-100 underline"
                        >
                          Read our Colorado compliance FAQ →
                        </Link>
                      </p>
                    </div>
                  )}
                  {topic.recommendation && (
                    <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-4 mt-4">
                      <p className="text-gold-300 leading-relaxed">
                        <strong>Our recommendation:</strong>{" "}
                        {topic.recommendation}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <p className="text-navy-200 mb-6">
                Our client services team can share what we know about
                requirements in your area—though we always recommend independent
                legal counsel.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact" className="btn btn-outline-gold">
                  <Calendar className="w-5 h-5" />
                  Schedule Consultation
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-outline-gold"
                >
                  Find LGBTQ+ Family Law Attorneys
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 4: Planning for Your Future Family */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-navy-900 mb-4">Thinking Ahead</h2>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-12">
            {/* Siblings Planning */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {futurePlanning[0] && (
                <>
                  <div className="flex gap-6 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                      <Warehouse className="w-8 h-8 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-3">
                        {futurePlanning[0].title}
                      </h3>
                      <p className="text-navy-700 font-medium mb-4">
                        <strong>Why it matters:</strong>{" "}
                        {futurePlanning[0].whyItMatters}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-3">
                      <strong>How to plan:</strong>
                    </p>
                    <ol className="space-y-2 list-decimal list-inside">
                      {futurePlanning[0].howToPlan?.map((item, idx) => (
                        <li key={idx} className="text-navy-700 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mb-6">
                    <p className="text-navy-700 font-medium mb-3">
                      <strong>Storage incentives:</strong>
                    </p>
                    <ul className="space-y-2">
                      {futurePlanning[0].storageIncentives?.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-navy-700"
                        >
                          <CheckCircle2 className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {futurePlanning[0].testimonial && (
                    <div className="bg-white rounded-lg p-4 border-l-4 border-gold-400">
                      <p className="text-navy-700 italic mb-2">
                        &ldquo;{futurePlanning[0].testimonial.quote}&rdquo;
                      </p>
                      <p className="text-sm text-navy-600">
                        — {futurePlanning[0].testimonial.author}
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Costs Planning */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-cream-50 rounded-2xl p-8 lg:p-10 border border-cream-200"
            >
              {futurePlanning[1] && (
                <>
                  <div className="flex gap-6 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-8 h-8 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading font-semibold text-navy-900 mb-3">
                        {futurePlanning[1].title}
                      </h3>
                      <p className="text-navy-700 font-medium mb-4">
                        <strong>Transparent pricing matters.</strong> Here's what to
                        budget for:
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gold-400">
                          <th className="text-left py-3 px-4 font-semibold text-navy-900">
                            Item
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-navy-900">
                            Typical Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {futurePlanning[1].items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-cream-200">
                            <td className="py-3 px-4 text-navy-700 font-medium">
                              {item.item}
                            </td>
                            <td className="py-3 px-4 text-navy-700">{item.cost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-4">
                    <p className="text-navy-700 text-sm">
                      <strong>Not included:</strong> {futurePlanning[1].note}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-l-4 border-gold-400">
                    <p className="text-navy-700 text-sm leading-relaxed">
                      <strong>{futurePlanning[1].financing}</strong>{" "}
                      <Link
                        href="/pricing"
                        className="text-gold-600 font-semibold hover:text-gold-700 transition-colors"
                      >
                        Learn more →
                      </Link>
                    </p>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/pricing"
                      className="btn btn-secondary text-sm px-6 py-2.5"
                    >
                      View Full Pricing
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 5: Stories from LGBTQ+ Families */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-navy-900 mb-4">Families Share Their Journeys</h2>
            <p className="text-lg text-navy-700 max-w-3xl mx-auto leading-relaxed">
              Every family's path is different. Here's how some LGBTQ+ families
              describe their experience with Xytex.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-cream-200 shadow-sm"
              >
                <blockquote className="text-lg text-navy-700 italic mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-navy-600">
                      {testimonial.location}
                    </div>
                    <div className="text-xs text-navy-500 mt-1">
                      {testimonial.type}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Getting Started */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-navy-900 mb-4">Your Journey Starts Here</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto mb-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-navy-900 flex items-center justify-center shadow-lg">
                    <step.icon className="w-10 h-10 text-gold-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold-500 text-navy-900 text-sm font-bold flex items-center justify-center shadow-md">
                    {step.number.replace("0", "")}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-navy-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-navy-700 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

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
            >
              Create Your Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-navy-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link
              href="/contact"
              className="text-gold-600 font-semibold hover:text-gold-700 transition-colors animated-underline text-lg inline-flex items-center gap-2"
            >
              Schedule a Free Consultation
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 8: Final CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-white text-3xl md:text-4xl font-heading font-bold mb-6">
              Ready to Take the Next Step?
            </h2>
            <p className="text-xl text-navy-100 mb-10 leading-relaxed">
              You don't have to have everything figured out. Start by browsing
              donors, asking questions, or just learning more. We're here
              whenever you're ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                href="/browse-donors"
                className="btn btn-primary text-base px-8 py-4"
              >
                Browse Donors Free for 7 Days
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="btn btn-white text-base px-8 py-4"
              >
                <Calendar className="w-5 h-5" />
                Schedule Free Consultation
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-navy-200 text-sm">
              <span>FDA Registered</span>
              <span>•</span>
              <span>AATB Accredited</span>
              <span>•</span>
              <span>50 Years</span>
              <span>•</span>
              <span>100% Identity Disclosed</span>
              <span>•</span>
              <span>Shipped to 35+ Countries</span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
