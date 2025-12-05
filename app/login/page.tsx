import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle py-20">
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-heading font-bold text-navy-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-navy-600">
                Sign in to continue browsing donors
              </p>
            </div>

            <LoginForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-navy-600">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-gold-600 font-semibold hover:text-gold-700 transition-colors"
                >
                  Sign up for free
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

