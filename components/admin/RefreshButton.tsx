"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh the router to get latest data
    router.refresh();
    // Small delay to show the animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="btn btn-secondary flex items-center gap-2"
      title="Refresh accounts"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );
}

