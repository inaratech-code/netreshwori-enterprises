"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Tracks page views for admin analytics. Runs only on the client; uses dynamic
 * import so Firebase/Firestore are never loaded during SSR.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Skip admin routes (no need to track admin panel as "page views")
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    import("@/lib/admin/analytics").then(({ trackPageView }) => {
      const page = pathname === "/" ? "home" : pathname.replace(/^\//, "").replace(/\//g, "_");
      trackPageView(page).catch(() => {});
    });
  }, [pathname]);

  return null;
}
