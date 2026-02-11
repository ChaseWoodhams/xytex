"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Building2, LogOut, User, Menu, X, Megaphone, Stethoscope } from "lucide-react";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen: controlledIsOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onClose ? () => onClose() : setInternalIsOpen;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-navy-900 text-white min-h-screen fixed left-0 top-0 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between mb-8 lg:justify-start">
            <Link href="/admin/accounts" className="flex items-center gap-2" onClick={handleLinkClick}>
              <Building2 className="w-6 h-6" />
              <span className="text-xl font-heading font-bold">Xytex CRM</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            <Link
              href="/admin/clinic-tools"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname?.startsWith("/admin/clinic-tools") || 
                pathname?.startsWith("/admin/accounts") || 
                pathname?.startsWith("/admin/invitations")
                  ? "bg-gold-600 text-white"
                  : "hover:bg-navy-800"
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <span>Clinic Tools</span>
            </Link>
            <Link
              href="/admin/marketing-tools"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname?.startsWith("/admin/marketing-tools")
                  ? "bg-gold-600 text-white"
                  : "hover:bg-navy-800"
              }`}
            >
              <Megaphone className="w-5 h-5" />
              <span>Marketing Tools</span>
            </Link>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-navy-800">
          <Link
            href="/account"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors mb-2"
          >
            <User className="w-5 h-5" />
            <span>My Account</span>
          </Link>
          <button
            onClick={() => {
              handleSignOut();
              handleLinkClick();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

