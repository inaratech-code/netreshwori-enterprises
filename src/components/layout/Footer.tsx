import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-300 py-12 md:py-16">
            <div className="container mx-auto px-4">
                {/* Centered logo */}
                <div className="flex flex-col items-center text-center mb-10 md:mb-12">
                    <Link href="/" className="inline-block transition-opacity duration-300 hover:opacity-90 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-950">
                        <Image
                            src="/logo/LOGO.png"
                            alt="Netreshwori Enterprises"
                            width={440}
                            height={110}
                            className="h-28 w-auto md:h-36 lg:h-40 object-contain drop-shadow-sm"
                        />
                    </Link>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-md mt-4">
                        Premium tile wholesaler providing high-quality tiles for all your residential and commercial needs. Elegance in every step.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <a href="https://www.facebook.com/profile.php?id=61587626611845" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Facebook">
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a href="https://www.instagram.com/netreshworienterprises" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Instagram">
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Two columns: Quick Links | Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 max-w-2xl mx-auto mb-12">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-semibold text-lg">Quick Links</h3>
                        <div className="flex flex-col gap-3 text-sm">
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
                            <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
                            <Link href="/#categories" className="hover:text-primary transition-colors">Categories</Link>
                            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-semibold text-lg">Categories</h3>
                        <div className="flex flex-col gap-3 text-sm">
                            <Link href="/products?category=Cement" className="hover:text-primary transition-colors">Cement</Link>
                            <Link href="/products?category=CPVC%20%2F%20PVC" className="hover:text-primary transition-colors">CPVC / PVC</Link>
                            <Link href="/products?category=Granite%20%2F%20Marble" className="hover:text-primary transition-colors">Granite / Marble</Link>
                            <Link href="/products?category=Floor%20Tile" className="hover:text-primary transition-colors">Floor Tile</Link>
                            <Link href="/products?category=Wall%20%2F%20Floor%20Tile" className="hover:text-primary transition-colors">Wall / Floor Tile</Link>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col items-center gap-4 text-center text-sm border-t border-slate-800 pt-8 mb-8">
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        <a href="https://maps.app.goo.gl/1Cyx947pjRU4y4TGA" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span>Head Office</span>
                        </a>
                        <a href="https://maps.app.goo.gl/7ZgxgjEoXcspz5SD9" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span>Branch Office</span>
                        </a>
                        <a href="tel:+9779864320452" className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <span>+977 9864320452</span>
                        </a>
                        <a href="mailto:netreshworienterprises2065@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                            <span>Email</span>
                        </a>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Netreshwori Enterprises. All rights reserved. · Inara Tech</p>
                </div>
            </div>
        </footer>
    );
}
