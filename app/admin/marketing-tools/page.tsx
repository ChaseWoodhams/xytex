import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { redirect } from 'next/navigation';
import CarePackageDashboard from '@/components/admin/Marketing/CarePackageDashboard';

export default async function MarketingToolsPage() {
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
        <CarePackageDashboard />
      </div>
    </div>
  );
}
