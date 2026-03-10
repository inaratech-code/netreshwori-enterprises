"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/auth/AuthContext";
import { LenisProvider } from "./LenisProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <LenisProvider>
          {children}
          <Toaster position="top-center" />
        </LenisProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
