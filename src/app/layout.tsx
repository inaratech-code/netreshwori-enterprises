import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import "lenis/dist/lenis.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// Load auth (Firebase) only on the client so Cloudflare Workers SSR never runs Firebase SDK.
const Providers = dynamic(() => import("@/components/auth/Providers").then((m) => m.Providers), { ssr: false });

// Use system font; next/font can cause 500 on Cloudflare Workers (loadManifest).
const bodyClassName = "font-sans antialiased";

export const metadata: Metadata = {
  title: "Netreshwori",
  description: "Find the best tiles for your home and office.",
  icons: {
    icon: ["/logo/LOGO.png"],
    apple: "/logo/LOGO.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Providers>
            <LenisProvider>{children}</LenisProvider>
            <Toaster position="top-center" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
