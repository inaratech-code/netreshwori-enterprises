"use client";

import { useState, useEffect, useRef } from "react";
import { Tags, Plus, Edit2, Trash2, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminCache } from "../AdminCacheContext";

interface Category {
    id: string;
    name: string;
    description: string;
    createdAt?: number | string | Date;
    updatedAt?: number | string | Date;
    productCount?: number;
}

export default function AdminCategoriesPage() {
    const cache = useAdminCache();
    const [categories, setCategories] = useState<Category[]>(() => cache.get<Category[]>("categoriesWithCount") ?? []);
    const [loading, setLoading] = useState(!cache.get<Category[]>("categoriesWithCount"));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const initialLoad = useRef(true);

    // Form state
    const [form, setForm] = useState<Partial<Category>>({
        id: "",
        name: "",
        description: "",
    });

    useEffect(() => {
        if (!initialLoad.current) return;
        initialLoad.current = false;
        const hasCache = !!cache.get<Category[]>("categoriesWithCount");
        fetchCategories(!hasCache);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only with cache
    }, []);

    const fetchCategories = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [{ getDb }, { collection, query, orderBy, getDocs, limit }] = await Promise.all([
                import("@/lib/firebase"),
                import("firebase/firestore"),
            ]);
            const [categoriesSnapshot, productsSnapshot] = await Promise.all([
                getDocs(query(collection(getDb(), "categories"), orderBy("createdAt", "desc"))),
                getDocs(query(collection(getDb(), "products"), limit(3000))),
            ]);

            const productCountByCategory: Record<string, number> = {};
            productsSnapshot.forEach((d) => {
                const categoryId = d.data().categoryId;
                if (categoryId) productCountByCategory[categoryId] = (productCountByCategory[categoryId] || 0) + 1;
            });

            const list: Category[] = categoriesSnapshot.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    productCount: productCountByCategory[d.id] ?? 0,
                } as Category;
            });

            setCategories(list);
            cache.set("categoriesWithCount", list);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name) {
            toast.error("Category name is required");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Saving category...");

        try {
            const [{ getDb }, { collection, doc, updateDoc, addDoc, serverTimestamp }] = await Promise.all([
                import("@/lib/firebase"),
                import("firebase/firestore"),
            ]);
            if (form.id) {
                await updateDoc(doc(getDb(), "categories", form.id), {
                    name: form.name,
                    description: form.description || "",
                    updatedAt: serverTimestamp()
                });
                toast.success("Category updated", { id: toastId });
            } else {
                await addDoc(collection(getDb(), "categories"), {
                    name: form.name,
                    description: form.description || "",
                    createdAt: serverTimestamp()
                });
                toast.success("Category created", { id: toastId });
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save category", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        // Prevent deleting category if it has products associated
        const categoryToDelete = categories.find(c => c.id === deleteId);
        if (categoryToDelete && (categoryToDelete.productCount || 0) > 0) {
            toast.error(`Cannot delete category "${categoryToDelete.name}" because it contains ${categoryToDelete.productCount} products.`);
            setDeleteId(null);
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Deleting category...");

        try {
            const [{ getDb }, { doc, deleteDoc }] = await Promise.all([
                import("@/lib/firebase"),
                import("firebase/firestore"),
            ]);
            await deleteDoc(doc(getDb(), "categories", deleteId));
            setCategories(categories.filter(c => c.id !== deleteId));
            toast.success("Category deleted", { id: toastId });
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete category", { id: toastId });
        } finally {
            setDeleteId(null);
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const openModalForAdd = () => {
        setForm({
            id: "",
            name: "",
            description: "",
        });
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-0 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categories</h1>
                    <p className="text-slate-500">Manage product categories structure.</p>
                </div>
                <button
                    type="button"
                    onClick={openModalForAdd}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Category</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white px-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all text-slate-900"
                        />
                    </div>
                </div>

                <div className="min-h-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <th className="p-4 pl-6 w-16">Icon</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Products</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                                            <span>Loading categories...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((c) => (
                                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                <Tags className="w-5 h-5 text-slate-400" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{c.name}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 max-w-xs truncate">
                                            {c.description || <span className="text-slate-300 italic">No description</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${c.productCount && c.productCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {c.productCount || 0} products
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setForm(c); setIsModalOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 hover:text-primary rounded-lg transition-colors"
                                                    title="Edit Category"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(c.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Category"
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
                            <h2 className="text-xl font-bold text-slate-900">{form.id ? "Edit Category" : "Add New Category"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form className="p-6 flex-1 flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900"
                                    placeholder="e.g. Marble Tiles"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea
                                    rows={4}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 resize-none"
                                    placeholder="Brief description about the category..."
                                ></textarea>
                            </div>
                        </form>

                        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100">
                                {loading ? "Saving..." : "Save"}
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
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Category?</h3>
                            <p className="text-slate-500">
                                {categories.find(c => c.id === deleteId)?.productCount && categories.find(c => c.id === deleteId)!.productCount! > 0
                                    ? `You cannot delete this category. It contains ${categories.find(c => c.id === deleteId)?.productCount} products. Please reassign or delete the products first.`
                                    : 'Are you sure you want to delete this category? This action cannot be undone.'}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
                            >
                                {(categories.find(c => c.id === deleteId)?.productCount ?? 0) > 0 ? "Understood" : "Cancel"}
                            </button>
                            {(categories.find(c => c.id === deleteId)?.productCount ?? 0) === 0 && (
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-500/20 disabled:opacity-50"
                                >
                                    {loading ? "Deleting..." : "Delete"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
