"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  Heart,
  Users,
  Home,
  Shield,
  HelpCircle,
  Building,
  User,
  LogOut,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessAdmin } from "@/lib/utils/roles";
import { Building2 } from "lucide-react";

const navigation = {
  main: [
    {
      name: "Find a Donor",
      href: "/browse-donors",
      icon: Heart,
    },
    {
      name: "Your Journey",
      href: "#",
      icon: Users,
      children: [
        {
          name: "LGBTQ+ Family Building",
          href: "/lgbtq-family-building",
          description: "Inclusive support for all family structures",
        },
        {
          name: "Single Mothers by Choice",
          href: "/single-mother-by-choice",
          description: "Your family, your timeline, your terms",
        },
        {
          name: "At-Home Insemination",
          href: "/at-home-insemination",
          description: "Privacy, comfort, and flexibility",
        },
      ],
    },
    {
      name: "Pricing",
      href: "/pricing",
      icon: Shield,
    },
    {
      name: "About",
      href: "/about",
      icon: Building,
    },
  ],
};

export default function Header() {
  const router = useRouter();
  const { user, userProfile, loading, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-navy-900/80 backdrop-blur-sm"
      }`}
      role="banner"
    >
      <nav className="container-custom" aria-label="Main navigation">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2"
            aria-label="Xytex home page"
          >
            <div className="relative">
              <span
                className={`text-2xl font-bold font-heading tracking-tight transition-colors ${
                  isScrolled ? "text-navy-900" : "text-white"
                }`}
              >
                Xytex
              </span>
              <span className="absolute -top-1 -right-12 text-[10px] font-medium text-gold-500 tracking-wider">
                SINCE 1975
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1" role="menubar">
            {navigation.main.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() =>
                  item.children && setOpenDropdown(item.name)
                }
                onMouseLeave={() => setOpenDropdown(null)}
                onFocus={() =>
                  item.children && setOpenDropdown(item.name)
                }
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOpenDropdown(null);
                  }
                }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isScrolled
                      ? "text-navy-700 hover:text-navy-900 hover:bg-navy-50"
                      : "text-white hover:text-gold-300 hover:bg-white/10"
                  }`}
                  role="menuitem"
                  aria-haspopup={item.children ? "true" : undefined}
                  aria-expanded={item.children && openDropdown === item.name ? "true" : undefined}
                >
                  {item.name}
                  {item.children && (
                    <ChevronDown className="w-4 h-4 opacity-60" aria-hidden="true" />
                  )}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && openDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-navy-100 overflow-hidden"
                      role="menu"
                      aria-label={`${item.name} submenu`}
                    >
                      <div className="p-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block p-3 rounded-lg hover:bg-cream-100 transition-colors group"
                            role="menuitem"
                          >
                            <span className="block text-sm font-medium text-navy-900 group-hover:text-gold-700">
                              {child.name}
                            </span>
                            <span className="block text-xs text-navy-600 mt-1 leading-relaxed">
                              {child.description}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Phone */}
            <a
              href="tel:1-800-277-3210"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isScrolled
                  ? "text-navy-700 hover:text-gold-600"
                  : "text-white hover:text-gold-300"
              }`}
              aria-label="Call us at 1-800-277-3210"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>1-800-277-3210</span>
            </a>

            {!loading && (
              <>
                {user ? (
                  <>
                    {/* User Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isScrolled
                            ? "text-navy-700 hover:bg-navy-50"
                            : "text-white hover:bg-white/10"
                        }`}
                        aria-label="User menu"
                      >
                        <User className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">Account</span>
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </button>

                      <AnimatePresence>
                        {userMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-navy-100 overflow-hidden"
                            onMouseLeave={() => setUserMenuOpen(false)}
                          >
                            <Link
                              href="/account"
                              className="block px-4 py-3 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                My Account
                              </div>
                            </Link>
                            {canAccessAdmin(userProfile) && (
                              <Link
                                href="/admin"
                                className="block px-4 py-3 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4" />
                                  Admin CRM
                                </div>
                              </Link>
                            )}
                            <Link
                              href="/browse-donors"
                              className="block px-4 py-3 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                Browse Donors
                              </div>
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login/Signup Buttons */}
                    <Link
                      href="/login"
                      className={`text-sm font-medium transition-colors ${
                        isScrolled
                          ? "text-navy-700 hover:text-gold-600"
                          : "text-white hover:text-gold-300"
                      }`}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="btn btn-primary text-sm px-5 py-2.5"
                    >
                      Start Free Trial
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? "text-navy-700 hover:bg-navy-50"
                : "text-white hover:bg-white/10"
            }`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-navy-100"
            id="mobile-menu"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="container-custom py-4 space-y-2">
              {navigation.main.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() =>
                      !item.children && setIsMobileMenuOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-navy-800 font-medium rounded-lg hover:bg-cream-100 transition-colors text-base"
                    role="menuitem"
                  >
                    <item.icon className="w-5 h-5 text-gold-600" aria-hidden="true" />
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="ml-12 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-navy-700 hover:text-gold-700 transition-colors leading-relaxed"
                          role="menuitem"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile CTA */}
              <div className="pt-4 border-t border-navy-100 space-y-2">
                <a
                  href="tel:1-800-277-3210"
                  className="flex items-center gap-2 px-4 py-3 text-navy-700 text-base"
                  aria-label="Call us at 1-800-277-3210"
                >
                  <Phone className="w-5 h-5 text-gold-600" aria-hidden="true" />
                  <span>1-800-277-3210</span>
                </a>
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link
                          href="/account"
                          className="block btn btn-secondary w-full text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          My Account
                        </Link>
                        {canAccessAdmin(userProfile) && (
                          <Link
                            href="/admin"
                            className="block px-4 py-3 text-navy-800 font-medium rounded-lg hover:bg-cream-100 transition-colors text-base"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-gold-600" />
                              Admin CRM
                            </div>
                          </Link>
                        )}
                        <Link
                          href="/browse-donors"
                          className="block btn btn-primary w-full text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Browse Donors
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                          className="block w-full text-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block btn btn-secondary w-full text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/signup"
                          className="block btn btn-primary w-full text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Start Free Trial
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

