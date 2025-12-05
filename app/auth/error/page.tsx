import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center py-20">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy-900 mb-4">
            Verification Error
          </h1>
          <p className="text-navy-600 mb-6">
            There was a problem verifying your email or reset link. The link may have expired or already been used.
          </p>
          <div className="space-y-3">
            <Link href="/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
            <Link href="/signup" className="btn btn-secondary w-full">
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

