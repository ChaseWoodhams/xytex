import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle py-20">
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-heading font-bold text-navy-900 mb-2">
                Start Your Free Trial
              </h1>
              <p className="text-navy-600">
                Get 7 days of free access to browse all donor profiles
              </p>
            </div>

            <div className="mb-6 p-4 bg-gold-50 rounded-lg border border-gold-200">
              <p className="text-sm font-semibold text-navy-900 mb-2">
                What you'll get:
              </p>
              <ul className="space-y-1 text-sm text-navy-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-600 flex-shrink-0" />
                  <span>Full access to 200+ donor profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-600 flex-shrink-0" />
                  <span>Adult photos and detailed information</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold-600 flex-shrink-0" />
                  <span>No credit card required</span>
                </li>
              </ul>
            </div>

            <SignupForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-navy-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-gold-600 font-semibold hover:text-gold-700 transition-colors"
                >
                  Sign in
                  <ArrowRight className="w-4 h-4 inline ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

