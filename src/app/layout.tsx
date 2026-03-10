import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

// Load only on client so Cloudflare Workers SSR does minimal work (avoids 500 from next-themes/lenis/auth).
const ClientProviders = dynamic(
  () =>
    import("@/components/providers/ClientProviders").then((m) => ({ default: m.ClientProviders })),
  { ssr: false }
);

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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
