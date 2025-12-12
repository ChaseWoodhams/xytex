import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { redirect } from 'next/navigation';
import AccountMergeTool from '@/components/admin/AccountMergeTool';

export default async function DataToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userProfile = await getCurrentUser();
  if (!canAccessAdmin(userProfile)) {
    redirect('/');
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-navy-900 mb-2">
            Data Tools
          </h1>
          <p className="text-navy-600">
            Tools to help manage and clean up your CRM data
          </p>
        </div>

        <div className="space-y-6">
          <AccountMergeTool />
        </div>
      </div>
    </div>
  );
}

