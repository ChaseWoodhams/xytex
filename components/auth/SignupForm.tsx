"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if Supabase is configured
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        setError(
          "Supabase is not configured. Please check your .env.local file contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Make sure to restart your development server after adding environment variables."
        );
        setLoading(false);
        console.error('Supabase configuration check:', { hasUrl: !!url, hasKey: !!key });
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        setError(`Invalid Supabase URL format: ${url}. Please check NEXT_PUBLIC_SUPABASE_URL in your .env.local file.`);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?type=email&next=/account`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Create user profile and start trial via API
        try {
          const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: authData.user.id,
              email,
              fullName: fullName || undefined,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            setError(errorData.error || "Failed to create user profile. Please try again.");
            setLoading(false);
            return;
          }

          // Check if email confirmation is required
          if (authData.session) {
            // User is immediately signed in (email confirmation disabled)
            // Small delay to ensure session is persisted in cookies
            await new Promise(resolve => setTimeout(resolve, 200));
            router.push("/admin");
            router.refresh();
          } else {
            // Email confirmation required
            setError(null);
            setLoading(false);
            // Show success message that email was sent
            alert("Please check your email to confirm your account. You'll be able to sign in after confirmation.");
            router.push("/login");
          }
        } catch (fetchError: any) {
          setError(fetchError.message || "Failed to create user profile. Please try again.");
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle specific error types
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
      } else if (err.message?.includes('Missing Supabase')) {
        setError("Supabase is not configured. Please check your environment variables.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-navy-700 mb-2">
          Full Name (Optional)
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="Your name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-navy-700 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="At least 6 characters"
          />
        </div>
        <p className="mt-2 text-sm text-navy-500">
          By signing up, you'll get 7 days of free access to browse all donor profiles.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Free Account"
        )}
      </button>
    </form>
  );
}

