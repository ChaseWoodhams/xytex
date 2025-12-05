import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center py-20">
      <div className="container-custom">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-heading font-bold text-navy-900 mb-2">
              Reset Your Password
            </h1>
            <p className="text-navy-600 mb-6">
              Enter your new password below.
            </p>

            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}

