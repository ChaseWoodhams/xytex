import AdminRoute from "@/components/auth/AdminRoute";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-cream-50">
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 ml-64">
            {children}
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}

