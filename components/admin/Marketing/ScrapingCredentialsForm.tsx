"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface ScrapingCredentialsFormProps {
  onSaved?: () => void;
}

export default function ScrapingCredentialsForm({ onSaved }: ScrapingCredentialsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [credentialsExist, setCredentialsExist] = useState<boolean | null>(null);

  useEffect(() => {
    checkExisting();
  }, []);

  const checkExisting = async () => {
    try {
      const response = await fetch("/api/admin/scraping/credentials");
      if (response.ok) {
        const data = await response.json();
        setCredentialsExist(data.exists);
        if (data.exists && data.email) {
          setFormData((prev) => ({ ...prev, email: data.email }));
        }
      }
    } catch (error) {
      console.error("Error checking credentials:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/scraping/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save credentials");
      }

      setSuccess(true);
      setFormData({ email: "", password: "" });
      if (onSaved) {
        onSaved();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the stored credentials?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/scraping/credentials", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete credentials");
      }

      setCredentialsExist(false);
      setFormData({ email: "", password: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-heading font-semibold text-navy-900 mb-2">
          Xytex Login Credentials
        </h3>
        <p className="text-navy-600">
          Store your Xytex account credentials for automated scraping. Credentials are stored securely.
        </p>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700">
            {credentialsExist ? "Credentials updated successfully!" : "Credentials saved successfully!"}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Xytex Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            placeholder="your-email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Xytex Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 pr-10 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 hover:text-navy-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Credentials"
            )}
          </button>

          {credentialsExist && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-secondary text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Delete Credentials
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-navy-50 rounded-lg">
        <div className="text-sm text-navy-700">
          <strong>Note:</strong> Credentials are stored in the database. For production use, consider
          encrypting passwords at the application level or using environment variables for sensitive credentials.
        </div>
      </div>
    </div>
  );
}
