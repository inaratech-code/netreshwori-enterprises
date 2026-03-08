import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-300 py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="inline-block transition-opacity duration-300 hover:opacity-90 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-950">
                            <Image
                                src="/logo/LOGO.png"
                                alt="Netreshwori"
                                width={440}
                                height={110}
                                className="h-32 w-auto md:h-40 lg:h-48 object-contain brightness-0 invert drop-shadow-sm"
                            />
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Premium tile wholesaler providing high-quality tiles for all your residential and commercial needs. Elegance in every step.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="https://www.facebook.com/profile.php?id=61587626611845" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Facebook">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/netreshworienterprises" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
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

                    {/* Categories */}
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

                    {/* Contact Info */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-semibold text-lg">Contact Info</h3>
                        <div className="flex flex-col gap-4 text-sm">
                            <div className="flex flex-col gap-1">
                                <a href="https://maps.app.goo.gl/1Cyx947pjRU4y4TGA" target="_blank" rel="noreferrer" className="flex gap-3 hover:text-primary transition-colors">
                                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>Head Office — Get Directions</span>
                                </a>
                                <a href="https://maps.app.goo.gl/7ZgxgjEoXcspz5SD9" target="_blank" rel="noreferrer" className="flex gap-3 hover:text-primary transition-colors">
                                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>Branch Office — Get Directions</span>
                                </a>
                            </div>
                            <div className="flex gap-3">
                                <Phone className="w-5 h-5 text-primary shrink-0" />
                                <span>+1 (234) 567-890</span>
                            </div>
                            <div className="flex gap-3">
                                <Mail className="w-5 h-5 text-primary shrink-0" />
                                <a href="mailto:netreshworienterprises2065@gmail.com" className="hover:text-primary transition-colors">netreshworienterprises2065@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Netreshwori Enterprises. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
