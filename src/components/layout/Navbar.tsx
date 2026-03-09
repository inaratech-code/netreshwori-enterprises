"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Products", href: "/products" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "Contact", href: "/contact" },
];

const SCROLL_THRESHOLD = 80;

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);
    const pathname = usePathname();

    const isHome = pathname === "/";
    const isScrolledOrNotHome = scrolled || !isHome;

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 20);
            if (y <= SCROLL_THRESHOLD) {
                setVisible(true);
            } else if (y > lastScrollY.current) {
                setVisible(false);
            } else {
                setVisible(true);
            }
            lastScrollY.current = y;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                !visible && "-translate-y-full",
                isScrolledOrNotHome
                    ? "bg-transparent py-0.5"
                    : "bg-transparent py-1"
            )}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 shrink-0 transition-opacity duration-300 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 rounded"
                    >
                        <Image
                            src="/logo/LOGO.png"
                            alt="Netreshwori Enterprises"
                            width={440}
                            height={110}
                            className="h-28 w-auto sm:h-32 md:h-36 lg:h-40 object-contain drop-shadow-sm"
                            priority
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex flex-1 items-center justify-center gap-5">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "text-base font-semibold transition-colors hover:text-primary relative group focus:outline-none",
                                    "text-white/90 hover:text-white",
                                    pathname === link.href && "text-white"
                                )}
                            >
                                {link.name}
                                {pathname === link.href && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute -bottom-0.5 left-2 right-2 h-px bg-white"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Contact Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <a
                            href="tel:+9779864320452"
                            className={cn(
                                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                                "text-white/90 hover:text-white"
                            )}
                        >
                            <Phone className="w-3 h-3" />
                            <span>Call Us</span>
                        </a>
                        <a
                            href="https://wa.me/9779864320452"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-transform hover:scale-105"
                        >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                        </a>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-3 -m-1 text-primary touch-manipulation"
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                    >
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-brand-gradient border-b border-white/10"
                    >
                        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-xl font-bold text-white hover:text-primary py-2 border-b border-white/10 last:border-none"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                                <a
                                    href="tel:+9779864320452"
                                    className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-3 rounded-lg font-medium"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Us
                                </a>
                                <a
                                    href="https://wa.me/9779864320452"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-medium"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
