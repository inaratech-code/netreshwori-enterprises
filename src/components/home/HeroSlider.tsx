"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?q=75&w=1200&auto=format&fit=crop",
        title: "Premium Quality Tiles for Your Dream Space",
        subtitle: "Discover our exclusive collection of ceramic, porcelain, and marble tiles designed to elevate and inspire your living spaces.",
        cta: "Shop Now",
        link: "/products",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=75&w=1200&auto=format&fit=crop",
        title: "Elegance in Every Step",
        subtitle: "Explore our latest marble collection featuring stunning patterns and unmatched durability for both residential and commercial projects.",
        cta: "Explore Marble",
        link: "/products?category=Marble",
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=75&w=1200&auto=format&fit=crop",
        title: "Modern Minimalist Designs",
        subtitle: "Create sleek, contemporary spaces with our large-format porcelain tiles. Perfect for a clean, seamless aesthetic.",
        cta: "View Collection",
        link: "/products",
    },
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

    return (
        <div className="relative h-screen min-h-[600px] w-full overflow-hidden bg-slate-950">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${SLIDES[current].image})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 h-full flex items-center pt-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                                    {SLIDES[current].title}
                                </h1>
                                <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
                                    {SLIDES[current].subtitle}
                                </p>
                                <Link
                                    href={SLIDES[current].link}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full font-medium text-lg transition-all hover:gap-4 hover:shadow-lg hover:shadow-primary/30"
                                >
                                    {SLIDES[current].cta}
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4">
                <div className="flex items-center gap-2 mr-4">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                i === current ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/80"
                            )}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
                <button
                    onClick={prevSlide}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20"
                    aria-label="Next slide"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
