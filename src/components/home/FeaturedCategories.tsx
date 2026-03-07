"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const CATEGORIES = [
    {
        id: "ceramic",
        name: "Ceramic Tiles",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
        desc: "Versatile and durable for everyday use.",
    },
    {
        id: "porcelain",
        name: "Porcelain Tiles",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
        desc: "High density and low water absorption.",
    },
    {
        id: "marble",
        name: "Marble",
        image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800",
        desc: "Timeless luxury and unparalleled beauty.",
    },
    {
        id: "mosaic",
        name: "Mosaic Tiles",
        image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=800",
        desc: "Intricate patterns for striking accents.",
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

export default function FeaturedCategories() {
    return (
        <section id="categories" className="py-24 bg-slate-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Explore Our <span className="text-primary">Categories</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            From the timeless elegance of marble to the resilient beauty of porcelain, discover collections curated to elevate your living spaces.
                        </p>
                    </div>
                    <Link
                        href="/products"
                        className="group flex flex-col items-center justify-center shrink-0 w-32 h-32 rounded-full border border-slate-200 hover:border-primary text-slate-900 hover:text-primary transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/5 bg-transparent"
                    >
                        <span className="font-semibold text-sm">View All</span>
                        <ArrowUpRight className="w-5 h-5 mt-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Link>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {CATEGORIES.map((category) => (
                        <motion.div key={category.id} variants={itemVariants}>
                            <Link href={`/products?category=${category.name}`} className="group block relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900 isolation-auto">
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-110"
                                    style={{ backgroundImage: `url(${category.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-2xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                                            {category.desc}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
