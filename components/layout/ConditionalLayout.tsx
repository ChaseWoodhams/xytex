"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header, Footer } from "./index";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only using pathname after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, pathname might be null or different, so we default to showing Header/Footer
  // After mount, we use the actual pathname to determine if it's an admin route
  // This prevents hydration mismatch while avoiding flash on admin routes
  const isAdminRoute = mounted && pathname ? pathname.startsWith("/admin") : false;

  return (
    <div className="w-full overflow-x-hidden">
      {!isAdminRoute && <Header />}
      <div className="w-full overflow-x-hidden">
        {children}
      </div>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
