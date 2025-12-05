import AdminRoute from "@/components/auth/AdminRoute";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Link from "next/link";
import { Home } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-cream-50 flex">
        {/* Sidebar - Always visible */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 ml-64 min-h-screen flex flex-col">
          {/* Top Bar - Always visible */}
          <div className="bg-white border-b border-navy-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-heading font-semibold text-navy-900">
                Business Development CRM
              </h2>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-navy-600 hover:text-navy-900 transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Back to Site</span>
            </Link>
          </div>
          
          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-cream-50">
            {children}
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}

