"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/auth/AuthContext";
import { LenisProvider } from "./LenisProvider";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <LenisProvider>
          <AnalyticsTracker />
          {children}
          <Toaster position="top-center" />
        </LenisProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
