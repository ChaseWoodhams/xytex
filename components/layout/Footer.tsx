import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Shield,
  Award,
  Clock,
  Heart,
} from "lucide-react";
import MedicalDisclaimer from "@/components/shared/MedicalDisclaimer";

const footerLinks = {
  findDonor: {
    title: "Find a Donor",
    links: [
      { name: "Browse All Donors", href: "/browse-donors" },
      { name: "How to Choose a Donor", href: "/how-to-choose" },
      { name: "Exclusive Donors", href: "/browse-donors?filter=exclusive" },
      { name: "CMV Negative Donors", href: "/browse-donors?filter=cmv-negative" },
    ],
  },
  yourJourney: {
    title: "Your Journey",
    links: [
      { name: "LGBTQ+ Family Building", href: "/lgbtq-family-building" },
      { name: "Single Mothers by Choice", href: "/single-mother-by-choice" },
      { name: "At-Home Insemination", href: "/at-home-insemination" },
      { name: "Couples with Infertility", href: "/infertility-solutions" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { name: "Pricing", href: "/pricing" },
      { name: "FAQ", href: "/faq" },
      { name: "Shipping & Delivery", href: "/shipping" },
      { name: "Storage Options", href: "/storage" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About Xytex", href: "/about" },
      { name: "Our 50-Year History", href: "/about#history" },
      { name: "Collection Centers", href: "/locations" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/xytex" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/xytex" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/xytex" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/xytex" },
];

const trustBadges = [
  { icon: Shield, label: "FDA Registered" },
  { icon: Award, label: "AATB Accredited" },
  { icon: Clock, label: "50 Years" },
  { icon: Heart, label: "Identity Disclosed" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white w-full overflow-x-hidden">
      {/* Trust Badges Bar */}
      <div className="border-b border-navy-800">
        <div className="container-custom py-6">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-gold-400"
              >
                <badge.icon className="w-5 h-5" />
                <span className="text-sm font-medium text-white/90">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold font-heading text-white">
                Xytex
              </span>
            </Link>
            <p className="mt-4 text-navy-200 text-base leading-relaxed max-w-sm">
              America&apos;s longest-running sperm bank. Since 1975, we&apos;ve helped
              families across 35+ countries achieve their dreams of parenthood.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a
                href="tel:1-800-277-3210"
                className="flex items-center gap-3 text-white/80 hover:text-gold-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-gold-500" />
                <span className="text-sm">1-800-277-3210</span>
              </a>
              <a
                href="mailto:info@xytex.com"
                className="flex items-center gap-3 text-white/80 hover:text-gold-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-gold-500" />
                <span className="text-sm">info@xytex.com</span>
              </a>
              <div className="flex items-start gap-3 text-white/80">
                <MapPin className="w-4 h-4 text-gold-500 mt-0.5" />
                <span className="text-sm">
                  1100 Emmett Street
                  <br />
                  Augusta, GA 30904
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-navy-800 text-navy-300 hover:bg-gold-600 hover:text-white transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy-200 hover:text-white transition-colors leading-relaxed"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Disclaimer - Compliance */}
      <div className="border-t border-navy-800 bg-navy-950/50">
        <div className="container-custom py-6">
          <MedicalDisclaimer variant="footer" className="text-center max-w-4xl mx-auto" />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-navy-400">
              © {new Date().getFullYear()} Xytex International, Inc. All rights
              reserved.
            </p>
            <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer legal links">
              <Link
                href="/privacy"
                className="text-sm text-navy-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-navy-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/accessibility"
                className="text-sm text-navy-400 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
              <Link
                href="/sitemap"
                className="text-sm text-navy-400 hover:text-white transition-colors"
              >
                Sitemap
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

