import { Suspense } from "react";
import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { redirect } from 'next/navigation';
import MarketingToolsClient from "@/components/admin/Marketing/MarketingToolsClient";

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
    <Suspense fallback={<div className="p-8"><div className="text-navy-600">Loading...</div></div>}>
      <MarketingToolsClient />
    </Suspense>
  );
}
