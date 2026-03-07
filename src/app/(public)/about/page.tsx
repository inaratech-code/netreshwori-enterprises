"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const STORY =
    "Founded in 2065 B.S., Netreshwori Enterprise is a trusted name in the supply of high-quality building and interior materials. We specialize in tiles, marble, granite, sanitary ware, bathroom fittings, and CPVC/PVC pipes and fittings, providing reliable solutions for modern construction and interior design. With years of industry experience, we are committed to delivering products that combine durability, style, and functionality. Our focus is on maintaining high standards of quality while offering competitive pricing and dependable service. At Netreshwori Enterprise, we strive to support homeowners, builders, and businesses by helping them create strong, elegant, and long-lasting spaces.";

const FOUNDERS = [
    {
        name: "Anil Kumar Bhojania",
        image: "/about/Anil%20Kumar%20bhojania.jpeg",
        role: "Founder",
    },
    {
        name: "Amit Kumar Bhojania",
        image: "/about/Amit%20Kumar%20bhojania.jpeg",
        role: "Founder",
    },
];

export default function AboutPage() {
    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                        About <span className="text-primary">Us</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Trusted in building and interior materials since 2065 B.S.
                    </p>
                </div>

                {/* About Us + Founders in one row */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start"
                >
                    {/* Company Story */}
                    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 lg:sticky lg:top-28">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">
                            About <span className="text-primary">Us</span>
                        </h2>
                        <p className="text-slate-700 leading-relaxed text-lg text-justify">
                            {STORY}
                        </p>
                    </div>

                    {/* Founders */}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Our <span className="text-primary">Founders</span>
                        </h2>
                        <p className="text-slate-600 mb-6">The people behind Netreshwori Enterprise</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {FOUNDERS.map((member, index) => (
                                <motion.div
                                    key={member.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow"
                                >
                                    <div className="relative aspect-[3/4] bg-slate-100">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 640px) 100vw, 50vw"
                                        />
                                    </div>
                                    <div className="p-4 text-center">
                                        <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                                        <p className="text-primary font-semibold text-sm mt-1">{member.role}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

            </div>
        </div>
    );
}
