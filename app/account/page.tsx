import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/users";
import { checkUserTrialStatus, formatDaysRemaining } from "@/lib/utils/trial";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import Link from "next/link";
import { Calendar, Clock, User, ArrowRight, Key } from "lucide-react";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  const trialStatus = user ? await checkUserTrialStatus(user.id) : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-subtle py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-heading font-bold text-navy-900 mb-8">
              My Account
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Trial Status Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-navy-900">
                      Free Trial Status
                    </h2>
                    <p className="text-sm text-navy-600">
                      {trialStatus?.isActive
                        ? formatDaysRemaining(trialStatus.daysRemaining)
                        : "Trial expired"}
                    </p>
                  </div>
                </div>

                {trialStatus?.isActive ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-gold-50 rounded-lg border border-gold-200">
                      <p className="text-sm text-navy-700">
                        <strong>Active Trial</strong>
                      </p>
                      <p className="text-xs text-navy-600 mt-1">
                        Expires:{" "}
                        {trialStatus.expiresAt
                          ? new Date(trialStatus.expiresAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <Link
                      href="/browse-donors"
                      className="btn btn-primary w-full text-center"
                    >
                      Browse Donors
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 bg-navy-50 rounded-lg border border-navy-200">
                    <p className="text-sm text-navy-700 mb-3">
                      Your free trial has expired. Upgrade to continue browsing
                      donor profiles.
                    </p>
                    <Link
                      href="/pricing"
                      className="btn btn-secondary w-full text-center"
                    >
                      View Pricing
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-navy-600" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold text-navy-900">
                    Profile Information
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-navy-600">Email</p>
                    <p className="text-navy-900 font-medium">{user?.email}</p>
                  </div>
                  {user?.full_name && (
                    <div>
                      <p className="text-sm text-navy-600">Full Name</p>
                      <p className="text-navy-900 font-medium">
                        {user.full_name}
                      </p>
                    </div>
                  )}
                  {user?.phone && (
                    <div>
                      <p className="text-sm text-navy-600">Phone</p>
                      <p className="text-navy-900 font-medium">{user.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Update Password Card */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
                  <Key className="w-6 h-6 text-navy-600" />
                </div>
                <h2 className="text-xl font-heading font-semibold text-navy-900">
                  Change Password
                </h2>
              </div>

              <UpdatePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

