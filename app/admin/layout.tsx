"use client";

import { useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminRoute>
      <div className="min-h-screen bg-cream-50 w-full overflow-x-hidden">
        <div className="flex w-full overflow-x-hidden">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 lg:ml-64 pt-0 w-full min-w-0 overflow-x-hidden">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-navy-900 text-white rounded-lg shadow-lg hover:bg-navy-800 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="pt-16 lg:pt-0 w-full overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}

