import { Suspense } from "react";
import ClinicToolsClient from "@/components/admin/ClinicTools/ClinicToolsClient";

export default function ClinicToolsPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="text-navy-600">Loading...</div></div>}>
      <ClinicToolsClient />
    </Suspense>
  );
}
