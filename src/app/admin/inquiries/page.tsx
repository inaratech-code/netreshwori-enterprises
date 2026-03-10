"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Trash2, Phone, MessageCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminCache } from "../AdminCacheContext";

interface Inquiry {
    id: string;
    name: string;
    phone: string;
    email?: string;
    productId?: string;
    subject?: string;
    message: string;
    status: "new" | "contacted";
    createdAt: number | string | Date;
}

export default function InquiriesPage() {
    const cache = useAdminCache();
    const [inquiries, setInquiries] = useState<Inquiry[]>(() => cache.get<Inquiry[]>("inquiries") ?? []);
    const [loading, setLoading] = useState(!cache.get<Inquiry[]>("inquiries"));
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const initialLoad = useRef(true);

    const fetchInquiries = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const q = query(collection(getDb(), "inquiries"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Inquiry[];
            setInquiries(data);
            cache.set("inquiries", data);
        } catch (error) {
            console.error("Error fetching inquiries:", error);
            toast.error("Failed to load inquiries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialLoad.current) return;
        initialLoad.current = false;
        const hasCache = !!cache.get<Inquiry[]>("inquiries");
        fetchInquiries(!hasCache);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only with cache
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(getDb(), "inquiries", deleteId));
            setInquiries(inquiries.filter((i) => i.id !== deleteId));
            toast.success("Inquiry deleted successfully");
        } catch {
            toast.error("Failed to delete inquiry");
        } finally {
            setDeleteId(null);
        }
    };

    const handleMarkContacted = async (id: string) => {
        try {
            await updateDoc(doc(getDb(), "inquiries", id), {
                status: "contacted"
            });
            setInquiries(inquiries.map(i => i.id === id ? { ...i, status: "contacted" } : i));
            toast.success("Marked as contacted");
        } catch {
            toast.error("Failed to update status");
        }
    };

    const getWhatsAppLink = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        return `https://wa.me/${cleanPhone}`;
    };

    const getCallLink = (phone: string) => {
        return `tel:${phone}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
                    <p className="text-muted-foreground mt-1">Manage customer inquiries and messages.</p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchInquiries(true)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="rounded-xl border bg-card shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Phone</th>
                                <th className="p-4 font-semibold">Product/Topic</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Loading inquiries...
                                        </div>
                                    </td>
                                </tr>
                            ) : inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No inquiries found.
                                    </td>
                                </tr>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{inquiry.name}</span>
                                                {inquiry.email && <span className="text-xs text-slate-500">{inquiry.email}</span>}
                                                {inquiry.subject && <span className="text-xs text-slate-500 mt-0.5">Subject: {inquiry.subject}</span>}
                                                {inquiry.message && <span className="text-sm text-slate-600 mt-1 line-clamp-2 max-w-xs">{inquiry.message}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-600">{inquiry.phone}</td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {inquiry.productId ? (
                                                <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium">Product ID: {inquiry.productId}</span>
                                            ) : (
                                                <span className="text-slate-400">General</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {inquiry.createdAt ? new Date((inquiry.createdAt as { toDate?: () => string | number | Date }).toDate?.() || inquiry.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            {inquiry.status === 'new' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    New
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Contacted
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                <a
                                                    href={getCallLink(inquiry.phone)}
                                                    className="p-2 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                                                    title="Call"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                                <a
                                                    href={getWhatsAppLink(inquiry.phone)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </a>
                                                {inquiry.status === 'new' && (
                                                    <button
                                                        onClick={() => handleMarkContacted(inquiry.id)}
                                                        className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                                        title="Mark as Contacted"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteId(inquiry.id)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Inquiry?</h3>
                            <p className="text-slate-500">Are you sure you want to delete this inquiry? This action cannot be undone.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
