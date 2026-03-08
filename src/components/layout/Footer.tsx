import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#0c1222] text-white/90 py-14 md:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top: centered logo, description, social (original design) */}
                <div className="flex flex-col items-center text-center mb-14 md:mb-16">
                    <Link href="/" className="inline-block transition-opacity duration-300 hover:opacity-90 rounded focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[#0c1222]">
                        <Image
                            src="/logo/LOGO.png"
                            alt="Netreshwori Enterprises"
                            width={440}
                            height={110}
                            className="h-28 w-auto md:h-36 lg:h-40 object-contain drop-shadow-sm"
                        />
                    </Link>
                    <p className="text-sm text-white/80 leading-relaxed max-w-md mt-5">
                        Premium tile wholesaler providing high-quality tiles for all your residential and commercial needs. Elegance in every step.
                    </p>
                    <div className="flex gap-4 mt-5">
                        <a href="https://www.facebook.com/profile.php?id=61587626611845" target="_blank" rel="noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" aria-label="Facebook">
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a href="https://www.instagram.com/netreshworienterprises" target="_blank" rel="noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" aria-label="Instagram">
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Middle: Quick Links (left) | Categories (right) – full width two columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16 max-w-4xl mx-auto mb-14 md:mb-16">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-lg">Quick Links</h3>
                        <div className="flex flex-col gap-3 text-sm text-white/90">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
                            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                            <Link href="/#categories" className="hover:text-white transition-colors">Categories</Link>
                            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-lg">Categories</h3>
                        <div className="flex flex-col gap-3 text-sm text-white/90">
                            <Link href="/products?category=Cement" className="hover:text-white transition-colors">Cement</Link>
                            <Link href="/products?category=CPVC%20%2F%20PVC" className="hover:text-white transition-colors">CPVC / PVC</Link>
                            <Link href="/products?category=Granite%20%2F%20Marble" className="hover:text-white transition-colors">Granite / Marble</Link>
                            <Link href="/products?category=Floor%20Tile" className="hover:text-white transition-colors">Floor Tile</Link>
                            <Link href="/products?category=Wall%20%2F%20Floor%20Tile" className="hover:text-white transition-colors">Wall / Floor Tile</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom: contact row with icons (thin separator) */}
                <div className="border-t border-white/15 pt-8 pb-8">
                    <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-white/90">
                        <a href="https://maps.app.goo.gl/1Cyx947pjRU4y4TGA" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                            <MapPin className="w-4 h-4 text-white/90 shrink-0" />
                            <span>Head Office</span>
                        </a>
                        <a href="https://maps.app.goo.gl/7ZgxgjEoXcspz5SD9" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                            <MapPin className="w-4 h-4 text-white/90 shrink-0" />
                            <span>Branch Office</span>
                        </a>
                        <a href="tel:+9779864320452" className="flex items-center gap-2 hover:text-white transition-colors">
                            <Phone className="w-4 h-4 text-white/90 shrink-0" />
                            <span>+977 9864320452</span>
                        </a>
                        <a href="mailto:netreshworienterprises2065@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                            <Mail className="w-4 h-4 text-white/90 shrink-0" />
                            <span>Email</span>
                        </a>
                    </div>
                </div>

                <div className="border-t border-white/15 pt-8 text-center text-sm text-white/60">
                    <p>&copy; {new Date().getFullYear()} Netreshwori Enterprises. All rights reserved. · Inara Tech</p>
                </div>
            </div>
        </footer>
    );
}
