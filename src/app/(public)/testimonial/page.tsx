"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MessageCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function TestimonialPage() {
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ name: "", message: "", rating: 5 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const { createTestimonial } = await import("@/lib/admin/firestore");
            await createTestimonial({
                name: form.name.trim(),
                message: form.message.trim(),
                rating: form.rating,
                approved: false,
            });
            setSubmitted(true);
            setForm({ name: "", message: "", rating: 5 });
            toast.success("Thank you! Your review will appear after we approve it.");
        } catch (err) {
            console.error("Testimonial submit error:", err);
            toast.error("Could not submit review. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-brand-gradient min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">

                <header className="text-center mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                        Share your <span className="text-primary">experience</span>
                    </h1>
                    <p className="text-slate-300 text-sm max-w-md mx-auto">
                        Tell others what you think about our products and service. Your review will be visible after approval.
                    </p>
                </header>

                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/30">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center text-center py-12 px-4"
                        >
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Thank you</h2>
                            <p className="text-slate-600 text-sm mb-6">Your review has been submitted and will appear once approved.</p>
                            <Link
                                href="/#testimonials"
                                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to testimonials
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div>
                                <label htmlFor="testimonial-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Your name
                                </label>
                                <input
                                    id="testimonial-name"
                                    type="text"
                                    required
                                    placeholder="e.g. Rajesh Kumar"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Rating
                                </label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setForm((p) => ({ ...p, rating: n }))}
                                            className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                                            aria-label={`${n} star${n > 1 ? "s" : ""}`}
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-colors ${form.rating >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="testimonial-message" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Your review
                                </label>
                                <textarea
                                    id="testimonial-message"
                                    required
                                    rows={4}
                                    placeholder="What did you like? How was the quality and service?"
                                    value={form.message}
                                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending}
                                className="mt-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <MessageCircle className="w-5 h-5" aria-hidden />}
                                {sending ? "Submitting..." : "Submit review"}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center mt-6">
                    <Link href="/contact" className="text-slate-300 hover:text-white text-sm transition-colors">
                        Need to contact us instead? Go to Contact →
                    </Link>
                </p>
            </div>
        </div>
    );
}
