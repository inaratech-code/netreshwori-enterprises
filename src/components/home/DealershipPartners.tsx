"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DEALERSHIP_PARTNERS } from "@/data/partners";

function PartnerLogo({ partner }: { partner: { name: string; logo: string; url?: string } }) {
    const [failed, setFailed] = useState(false);
    const initial = partner.name.charAt(0).toUpperCase();

    return (
        <a
            href={partner.url || "#"}
            target={partner.url && partner.url !== "#" ? "_blank" : undefined}
            rel={partner.url && partner.url !== "#" ? "noreferrer" : undefined}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/20 transition-all shrink-0 w-[160px] md:w-[180px]"
        >
            <div className="relative w-24 h-16 md:w-28 md:h-20 opacity-95 hover:opacity-100 transition-opacity flex items-center justify-center bg-slate-100 rounded-lg [filter:none]" style={{ filter: "none" }}>
                {failed ? (
                    <span className="text-2xl font-bold text-slate-400">{initial}</span>
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- partner logo from public/partners
                    <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-full h-full object-contain"
                        style={{ filter: "none" }}
                        onError={() => setFailed(true)}
                    />
                )}
            </div>
            <span className="text-sm font-medium text-slate-700 text-center">{partner.name}</span>
        </a>
    );
}

export default function DealershipPartners() {
    if (DEALERSHIP_PARTNERS.length === 0) return null;

    return (
        <section id="dealership-partners" className="py-16 md:py-20 bg-brand-gradient border-y border-slate-200/60 overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Our <span className="text-primary">Dealership</span> Partners
                    </h2>
                    <p className="text-slate-300 mt-2 max-w-xl mx-auto">
                        Authorized dealer for trusted brands in building and interior materials.
                    </p>
                </motion.div>
            </div>
            {/* Clip to viewport so only the looping marquee is visible — no scroll, no blank space after Prime */}
            <div className="relative overflow-x-hidden overflow-y-hidden py-4">
                <motion.div
                    className="flex shrink-0 gap-12 md:gap-16 items-center w-max"
                    animate={{ x: [0, "-50%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 30,
                            ease: "linear",
                        },
                    }}
                >
                    {[...DEALERSHIP_PARTNERS, ...DEALERSHIP_PARTNERS].map((partner, index) => (
                        <PartnerLogo key={`${partner.name}-${index}`} partner={partner} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
