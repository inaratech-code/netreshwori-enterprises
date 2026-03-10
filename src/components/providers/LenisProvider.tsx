"use client";

import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { ReactLenis } from "lenis/react";

const lenisOptions = {
  autoRaf: true,
  duration: 0.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: "vertical" as const,
  gestureOrientation: "vertical" as const,
  smoothWheel: true,
  touchMultiplier: 2,
};

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  // Admin panel uses its own scroll container; Lenis would capture wheel and block it
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}
