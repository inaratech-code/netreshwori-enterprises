"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Search, X, Star } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { sanitizeStorageFileName } from "@/lib/admin/storage";
import toast from "react-hot-toast";
import { useAdminCache } from "../AdminCacheContext";

interface Testimonial {
    id: string;
    name: string;
    message: string;
    rating: number;
    photo?: string;
    approved: boolean;
    createdAt?: number | string | Date;
    updatedAt?: number | string | Date;
}

export default function AdminTestimonialsPage() {
    const cache = useAdminCache();
    const [testimonials, setTestimonials] = useState<Testimonial[]>(() => cache.get<Testimonial[]>("testimonials") ?? []);
    const [loading, setLoading] = useState(!cache.get<Testimonial[]>("testimonials"));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const initialLoad = useRef(true);

    // Form state
    const [form, setForm] = useState<Partial<Testimonial>>({
        id: "",
        name: "",
        message: "",
        rating: 5,
        photo: "",
        approved: false,
    });

    useEffect(() => {
        if (!initialLoad.current) return;
        initialLoad.current = false;
        const hasCache = !!cache.get<Testimonial[]>("testimonials");
        fetchTestimonials(!hasCache);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only with cache
    }, []);

    const fetchTestimonials = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list: Testimonial[] = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial));
            setTestimonials(list);
            cache.set("testimonials", list);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load testimonials");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const storageRef = ref(storage, `testimonials/${Date.now()}_${sanitizeStorageFileName(file.name)}`);
            await uploadBytesResumable(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setForm((prev) => ({ ...prev, photo: url }));
            toast.success("Photo uploaded");
        } catch {
            toast.error("Photo upload failed");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.message) {
            toast.error("Name and message are required");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Saving testimonial...");

        try {
            if (form.id) {
                await updateDoc(doc(db, "testimonials", form.id), {
                    name: form.name,
                    message: form.message,
                    rating: Number(form.rating),
                    photo: form.photo || null,
                    approved: form.approved || false,
                    updatedAt: serverTimestamp()
                });
                toast.success("Testimonial updated", { id: toastId });
            } else {
                await addDoc(collection(db, "testimonials"), {
                    name: form.name,
                    message: form.message,
                    rating: Number(form.rating),
                    photo: form.photo || null,
                    approved: form.approved || false,
                    createdAt: serverTimestamp()
                });
                toast.success("Testimonial added", { id: toastId });
            }
            setIsModalOpen(false);
            fetchTestimonials();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save testimonial", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        const toastId = toast.loading("Deleting testimonial...");
        try {
            await deleteDoc(doc(db, "testimonials", deleteId));
            setTestimonials(testimonials.filter(t => t.id !== deleteId));
            toast.success("Testimonial deleted", { id: toastId });
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete testimonial", { id: toastId });
        } finally {
            setDeleteId(null);
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        try {
            await updateDoc(doc(db, "testimonials", id), { approved: newStatus });
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, approved: newStatus } : t));
            toast.success(newStatus ? "Testimonial approved" : "Testimonial unapproved");
        } catch {
            toast.error("Failed to update status");
        }
    };

    const filteredTestimonials = testimonials.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase())
    );

    const openModalForAdd = () => {
        setForm({
            id: "",
            name: "",
            message: "",
            rating: 5,
            photo: "",
            approved: true,
        });
        setIsModalOpen(true);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-amber-400" : "fill-slate-200 text-slate-200"}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Testimonials</h1>
                    <p className="text-slate-500">Manage customer reviews and feedback.</p>
                </div>
                <button
                    onClick={openModalForAdd}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Testimonial</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white px-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <th className="p-4 pl-6">Customer</th>
                                <th className="p-4">Rating</th>
                                <th className="p-4">Review Message</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && testimonials.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                                            <span>Loading testimonials...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTestimonials.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                                        No testimonials found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTestimonials.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                {t.photo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element -- dynamic Firebase Storage URL
                                                    <img src={t.photo} alt="" className="w-10 h-10 rounded-full object-cover border" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                                                        {t.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="font-semibold">{t.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {renderStars(t.rating)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 max-w-sm">
                                            <div className="line-clamp-2" title={t.message}>{t.message}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg ${t.approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {t.approved ? (
                                                    <><CheckCircle className="w-3.5 h-3.5" /> Approved</>
                                                ) : (
                                                    <><XCircle className="w-3.5 h-3.5" /> Pending</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleStatus(t.id, t.approved)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t.approved ? "Unapprove Review" : "Approve Review"}
                                                >
                                                    {t.approved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(t.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Testimonial"
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

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900">{form.id ? "Edit Testimonial" : "Add Testimonial"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form className="p-6 flex-1 flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Photo</label>
                                <div className="flex items-center gap-4">
                                    {form.photo ? (
                                        // eslint-disable-next-line @next/next/no-img-element -- dynamic Firebase Storage URL
                                        <img src={form.photo} alt="" className="w-16 h-16 rounded-full object-cover border" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-slate-100 border flex items-center justify-center text-slate-400 text-sm">No photo</div>
                                    )}
                                    <label className="cursor-pointer">
                                        <span className="text-sm font-medium text-primary hover:underline">{uploadingPhoto ? "Uploading..." : "Upload photo"}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900"
                                    placeholder="e.g. Ramesh P."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Rating</label>
                                <select
                                    value={form.rating}
                                    onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900"
                                >
                                    <option value={5}>5 Stars (Excellent)</option>
                                    <option value={4}>4 Stars (Good)</option>
                                    <option value={3}>3 Stars (Average)</option>
                                    <option value={2}>2 Stars (Poor)</option>
                                    <option value={1}>1 Star (Terrible)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Review Content *</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 resize-none"
                                    placeholder="What did the customer say..."
                                ></textarea>
                            </div>

                            <div className="flex items-center pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.approved}
                                        onChange={e => setForm({ ...form, approved: e.target.checked })}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300"
                                    />
                                    <span className="font-semibold text-slate-700 flex flex-col">
                                        <span>Publish Immediately</span>
                                        <span className="text-xs text-slate-500 font-normal">Show on the public website</span>
                                    </span>
                                </label>
                            </div>
                        </form>

                        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100">
                                {loading ? "Saving..." : "Save Review"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Testimonial?</h3>
                            <p className="text-slate-500">
                                Are you sure you want to delete this testimonial? This action cannot be undone.
                            </p>
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
                                disabled={loading}
                                className="px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-500/20 disabled:opacity-50"
                            >
                                {loading ? "Deleting..." : "Delete"}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
