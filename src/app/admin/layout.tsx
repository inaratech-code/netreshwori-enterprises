"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthContext";
import {
  LayoutDashboard,
  Package,
  Tags,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Inbox,
  Settings,
  BarChart3,
  ImageIcon,
  Building2,
} from "lucide-react";
import { AdminCacheProvider } from "./AdminCacheContext";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Brands", href: "/admin/brands", icon: Building2 },
  { name: "Inquiries", href: "/admin/inquiries", icon: Inbox },
  { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Media Library", href: "/admin/media", icon: ImageIcon },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const allowedEmails = typeof process.env.NEXT_PUBLIC_ADMIN_EMAILS === "string"
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
      : [];
    if (allowedEmails.length > 0 && user.email && !allowedEmails.includes(user.email.toLowerCase())) {
      router.push("/login?error=unauthorized");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    ADMIN_LINKS.forEach(({ href }) => router.prefetch(href));
  }, [user, router]);

  const prefetchOnHover = (href: string) => {
    router.prefetch(href);
  };

  if (loading) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin transition-opacity duration-300" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-theme h-screen max-h-screen bg-background flex overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-card border-r border-border admin-sidebar lg:static",
          "transform transition-transform duration-200 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col pt-6 pb-4 overflow-hidden">
          <div className="px-4 mb-8 flex items-center justify-between gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-3 min-w-0 group">
              <span className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-full overflow-hidden bg-white ring-1 ring-border">
                <Image
                  src="/logo/LOGO.png"
                  alt="Netreshwori"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </span>
              <span className="font-semibold text-lg tracking-tight truncate text-foreground group-hover:opacity-90 transition-opacity duration-200">
                Netreshwori
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors duration-200 active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-x-hidden min-h-0">
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch
                  onMouseEnter={() => prefetchOnHover(link.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "admin-nav-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 mt-auto shrink-0 pt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="admin-btn admin-logout-btn flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors duration-200 active:scale-[0.98]"
              style={{ color: "#dc2626" }}
            >
              <LogOut className="w-5 h-5 shrink-0 [color:inherit] [stroke:currentColor]" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main-scroll flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
        <header className="admin-header sticky top-0 z-10 shrink-0 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-card border-b border-border shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors duration-200 active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block whitespace-nowrap">
              {user.email}
            </span>
            <Link href="/" className="shrink-0 flex items-center h-11 transition-opacity duration-200 hover:opacity-90">
              <Image
                src="/logo/LOGO.png"
                alt="Netreshwori"
                width={140}
                height={44}
                className="h-11 w-auto object-contain"
              />
            </Link>
          </div>
        </header>

        <div className="admin-content flex-1 min-h-0 p-4 sm:p-6 lg:p-8">
          <AdminCacheProvider>
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AdminCacheProvider>
        </div>
      </main>
    </div>
  );
}
