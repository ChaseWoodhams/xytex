import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center py-20">
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-heading font-bold text-navy-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-navy-600 mb-6">
              No worries! Enter your email and we'll send you a reset link.
            </p>

            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}

