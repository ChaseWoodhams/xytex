"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Building2, LogOut, User } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-navy-900 text-white min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <Link href="/admin/accounts" className="flex items-center gap-2 mb-8">
          <Building2 className="w-6 h-6" />
          <span className="text-xl font-heading font-bold">Xytex CRM</span>
        </Link>
        <nav className="space-y-2">
          <Link
            href="/admin/accounts"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname?.startsWith("/admin/accounts")
                ? "bg-gold-600 text-white"
                : "hover:bg-navy-800"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Accounts</span>
          </Link>
        </nav>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-navy-800">
        <Link
          href="/account"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors mb-2"
        >
          <User className="w-5 h-5" />
          <span>My Account</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-navy-800 transition-colors w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

