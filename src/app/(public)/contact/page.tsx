"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, MessageCircle, Send, CheckCircle2 } from "lucide-react";

const OfficeMap = dynamic(() => import("@/components/contact/OfficeMap"), { ssr: false });

const HEAD_OFFICE_MAPS = "https://maps.app.goo.gl/1Cyx947pjRU4y4TGA";
const BRANCH_OFFICE_MAPS = "https://maps.app.goo.gl/7ZgxgjEoXcspz5SD9";
const EMAIL = "netreshworienterprises2065@gmail.com";

const contactCards = [
    {
        icon: MapPin,
        iconClass: "bg-primary/10 text-primary",
        title: "Our Offices",
        items: [
            { label: "Head Office", href: HEAD_OFFICE_MAPS },
            { label: "Branch Office", href: BRANCH_OFFICE_MAPS },
        ],
    },
    {
        icon: Phone,
        iconClass: "bg-primary/10 text-primary",
        title: "Call Us",
        subtitle: "Mon–Fri, 9am–6pm",
        link: { href: "tel:+9779864320452", text: "+977 9864320452" },
    },
    {
        icon: MessageCircle,
        iconClass: "bg-green-500/10 text-green-600",
        title: "WhatsApp",
        subtitle: "Message us anytime",
        link: { href: "https://wa.me/9779864320452", text: "Chat on WhatsApp", external: true },
    },
    {
        icon: Mail,
        iconClass: "bg-primary/10 text-primary",
        title: "Email",
        subtitle: "We reply within 24 hours",
        link: { href: `mailto:${EMAIL}`, text: EMAIL },
    },
];

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <div className="bg-brand-gradient min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                        Get in <span className="text-primary">Touch</span>
                    </h1>
                    <p className="text-slate-600 text-sm max-w-xl mx-auto">
                        Questions about products, pricing, or a custom quote? We’re here to help.
                    </p>
                </header>

                {/* Contact info + Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 mb-12 lg:mb-16">
                    {/* Contact cards */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h2>
                        {contactCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={card.title}
                                    className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
                                >
                                    <div className={`${card.iconClass} w-12 h-12 rounded-xl shrink-0 flex items-center justify-center`}>
                                        <Icon className="w-6 h-6" strokeWidth={1.75} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900 mb-0.5">{card.title}</h3>
                                        {card.subtitle && (
                                            <p className="text-slate-500 text-sm mb-2">{card.subtitle}</p>
                                        )}
                                        {"items" in card && card.items ? (
                                            <div className="space-y-2">
                                                {card.items.map((item) => (
                                                    <div key={item.label} className="flex flex-wrap items-center gap-2">
                                                        <span className="text-slate-700 text-sm">{item.label}</span>
                                                        <a
                                                            href={item.href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-primary font-medium text-sm hover:underline"
                                                        >
                                                            Directions →
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            card.link && (
                                                <a
                                                    href={card.link.href}
                                                    target={card.link.external ? "_blank" : undefined}
                                                    rel={card.link.external ? "noreferrer" : undefined}
                                                    className="text-primary font-medium text-sm hover:underline break-all"
                                                >
                                                    {card.link.text}
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Form */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/30">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Send a message</h2>
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center text-center py-12 px-4"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent</h3>
                                <p className="text-slate-600 text-sm">We’ll get back to you shortly.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div>
                                    <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Full name
                                    </label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        required
                                        placeholder="Your name"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            required
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Phone
                                        </label>
                                        <input
                                            id="contact-phone"
                                            type="tel"
                                            placeholder="+977 ..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Subject
                                    </label>
                                    <select
                                        id="contact-subject"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                                    >
                                        <option value="general">General inquiry</option>
                                        <option value="wholesale">Wholesale pricing</option>
                                        <option value="support">Product support</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Message
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        required
                                        rows={4}
                                        placeholder="How can we help?"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="mt-2 w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" aria-hidden />
                                    Send message
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Map */}
                <section className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg shadow-slate-200/30">
                    <OfficeMap />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-slate-50/80 border-t border-slate-200">
                        <p className="text-slate-600 text-sm">
                            Tap a red pin for details, or open in Google Maps for directions.
                        </p>
                        <div className="flex gap-4 text-sm">
                            <a href={HEAD_OFFICE_MAPS} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">
                                Head office →
                            </a>
                            <a href={BRANCH_OFFICE_MAPS} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">
                                Branch office →
                            </a>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
