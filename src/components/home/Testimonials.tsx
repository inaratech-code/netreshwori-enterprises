"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

const TESTIMONIALS = [
    {
        id: 1,
        name: "Rajesh Kumar",
        role: "Homeowner",
        text: "The quality of the marble we got from Netreshwori Enterprises is outstanding. It transformed our living room completely. Highly recommend their service!",
        rating: 5,
    },
    {
        id: 2,
        name: "Anita Sharma",
        role: "Interior Designer",
        text: "As a designer, I am very picky about tiles. Netreshwori is always my go-to wholesaler. Their porcelain collection is top-notch and always on trend.",
        rating: 5,
    },
    {
        id: 3,
        name: "Vikram Singh",
        role: "Contractor",
        text: "Excellent pricing for wholesale quantities and reliable delivery. The team is very professional and accommodating.",
        rating: 4,
    },
];

export default function Testimonials() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const next = () => setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    const prev = () => setCurrent((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

    return (
        <section id="testimonials" className="py-24 bg-brand-gradient overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Client <span className="text-primary">Testimonials</span>
                    </h2>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        Don&apos;t just take our word for it. Hear what our satisfied customers and partners have to say about our products and services.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute top-0 left-0 text-primary/10 -translate-x-1/2 -translate-y-1/2">
                        <Quote className="w-32 h-32" />
                    </div>

                    <div className="relative min-h-[300px] flex items-center justify-center bg-slate-50 p-8 md:p-12 rounded-3xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.5 }}
                                className="text-center z-10"
                            >
                                <div className="flex justify-center gap-1 mb-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-6 h-6 ${i < TESTIMONIALS[current].rating ? "fill-primary text-primary" : "text-slate-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xl md:text-2xl text-slate-700 italic font-medium leading-relaxed mb-8">
                                    &quot;{TESTIMONIALS[current].text}&quot;
                                </p>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{TESTIMONIALS[current].name}</h4>
                                    <p className="text-slate-500">{TESTIMONIALS[current].role}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <div className="flex gap-4">
                            <button
                                onClick={prev}
                                className="p-3 rounded-full border border-white/40 text-slate-300 hover:text-primary hover:border-primary transition-colors hover:bg-white/10"
                                aria-label="Previous testimonial"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={next}
                                className="p-3 rounded-full border border-white/40 text-slate-300 hover:text-primary hover:border-primary transition-colors hover:bg-white/10"
                                aria-label="Next testimonial"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-semibold transition-all hover:shadow-lg"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Share your experience
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
