"use client";

import React, { useState, useEffect, useRef, useMemo, startTransition, useCallback } from "react";
import { Package, Plus, Edit2, Trash2, Search, Loader2, ImagePlus, X, Upload, FileJson, Download, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, startAfter, where, writeBatch } from "firebase/firestore";
import type { DocumentSnapshot } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, type UploadMetadata } from "firebase/storage";
import toast from "react-hot-toast";
import { useAdminCache } from "../AdminCacheContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/imageCompression";
import { parseCsvToProducts } from "@/lib/parseCsv";
import { PARTNER_BRAND_NAMES } from "@/data/partners";
import { deleteAllProducts } from "@/lib/admin/firestore";
import { resolveProductImageSrc } from "@/lib/utils";

/** Thumbnail in Add/Edit form: resolves URL (e.g. Drive), shows preview or "Couldn't load" on error. */
function FormImageThumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  const [failed, setFailed] = useState(false);
  const src = resolveProductImageSrc(url);
  return (
    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 text-[10px] p-1 text-center">
          {src && failed ? (
            <>
              <span>Couldn&apos;t load</span>
              <a href={src} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-primary underline" onClick={e => e.stopPropagation()}>Open link</a>
            </>
          ) : (
            "No preview"
          )}
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 bg-white/90 text-slate-700 hover:bg-white" onClick={e => e.stopPropagation()} title="Open in new tab">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button type="button" onClick={onRemove} className="bg-red-500 text-white rounded-full p-2 shadow-lg scale-90 group-hover:scale-100 transition-all" title="Remove">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Lazy-loaded thumbnail for table; resolves filenames via base URL so CSV image names display. */
function ProductRowThumbnail({ src }: { src: string | undefined }) {
  const resolved = src ? resolveProductImageSrc(src) : "";
  const [failed, setFailed] = useState(false);
  if (!src || !resolved || failed) {
    return (
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <Package className="w-6 h-6 text-slate-300" />
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
    />
  );
}

interface ProductRowProps {
  p: Product;
  getCategoryName: (id: string) => string;
  getBrandName: (id: string) => string;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
}

const ProductTableRow = React.memo(function ProductTableRow({
  p,
  getCategoryName,
  getBrandName,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProductRowProps) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-200 group">
      <td className="p-4 pl-6 w-28">
        <span className="font-mono text-sm text-slate-600">{p.productCode || "—"}</span>
      </td>
      <td className="p-4">
        <div className="font-semibold text-slate-900">{p.name}</div>
      </td>
      <td className="p-4">
        <span className="inline-flex bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
          {getCategoryName(p.categoryId)}
        </span>
      </td>
      <td className="p-4 text-sm text-slate-600">{getBrandName(p.brandId ?? "")}</td>
      <td className="p-4 text-sm text-slate-600">{p.size || "—"}</td>
      <td className="p-4 text-sm text-slate-600">{p.finish || "—"}</td>
      <td className="p-4 w-20">
        <ProductRowThumbnail src={p.images?.[0]} />
      </td>
      <td className="p-4">
        <button
          type="button"
          onClick={() => onToggleStatus(p.id, p.status)}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 ${p.status === "active" ? "border-primary bg-primary" : "border-slate-300 bg-slate-200"}`}
          role="switch"
          aria-checked={p.status === "active"}
          title={p.status === "active" ? "Hide product" : "Show product"}
        >
          <span
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${p.status === "active" ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
        <span className="ml-2 text-sm font-medium text-slate-600">
          {p.status === "active" ? "Visible" : "Hidden"}
        </span>
      </td>
      <td className="p-4 pr-6">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={() => onEdit(p)}
            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200 active:scale-95"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(p.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 active:scale-95"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

interface Product {
    id: string;
    productCode?: string;
    name: string;
    brandId?: string;
    categoryId: string;
    size?: string;
    finish?: string;
    description?: string;
    images?: string[];
    featured?: boolean;
    status: "active" | "hidden";
    createdAt?: number | string | Date;
    updatedAt?: number | string | Date;
}

export default function AdminProductsPage() {
    const cache = useAdminCache();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>(() => cache.get<{ id: string, name: string }[]>("categories") ?? []);
    const [brands, setBrands] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const [search, setSearch] = useState("");
    const [uploading, setUploading] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState("");
    const initialLoad = useRef(true);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkJsonText, setBulkJsonText] = useState("");
    const [bulkSheetUrl, setBulkSheetUrl] = useState("");
    const [bulkFetchingSheet, setBulkFetchingSheet] = useState(false);
    const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);
    const [bulkImporting, setBulkImporting] = useState(false);
    const [bulkError, setBulkError] = useState("");
    const [filterCategoryId, setFilterCategoryId] = useState<string>("");
    const [filterBrandId, setFilterBrandId] = useState<string>("");
    const [tablePage, setTablePage] = useState(1);
    const TABLE_PAGE_SIZE = 20;
    const INITIAL_PRODUCTS_LIMIT = 50;
    const debouncedSearch = useDebounce(search, 300);
    const [lastProductDoc, setLastProductDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
    const tableScrollRef = useRef<HTMLDivElement>(null);

    // Form state
    const [form, setForm] = useState<Partial<Product>>({
        id: "",
        productCode: "",
        name: "",
        brandId: "",
        categoryId: "",
        size: "",
        finish: "",
        description: "",
        images: [],
        featured: false,
        status: "active"
    });

    useEffect(() => {
        if (!initialLoad.current) return;
        initialLoad.current = false;
        fetchData(true, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only
    }, []);

    const fetchData = async (showLoading = true, loadMore = false) => {
        if (loadMore) {
            if (!lastProductDoc || loadingMoreProducts || !hasMoreProducts) return;
            setLoadingMoreProducts(true);
        } else if (showLoading) {
            setLoading(true);
            setProductsLoading(true);
        }
        try {
            if (!loadMore) {
                const [categoriesSnapshot, brandsSnapshot] = await Promise.all([
                    getDocs(collection(db, "categories")),
                    getDocs(collection(db, "brands")),
                ]);
                const categoriesList = categoriesSnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
                let brandsList = brandsSnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
                const existingBrandNames = new Set(brandsList.map(b => b.name.toLowerCase().trim()));
                for (const partnerName of PARTNER_BRAND_NAMES) {
                    const n = partnerName.trim();
                    if (!n || existingBrandNames.has(n.toLowerCase())) continue;
                    const ref = await addDoc(collection(db, "brands"), {
                        name: n,
                        logo: "",
                        description: "",
                        status: "active",
                        createdAt: serverTimestamp(),
                    });
                    brandsList = [...brandsList, { id: ref.id, name: n }];
                    existingBrandNames.add(n.toLowerCase());
                }
                setCategories(categoriesList);
                setBrands(brandsList);
                cache.set("categories", categoriesList);
                setLoading(false);

                const productsSnapshot = await getDocs(
                    query(collection(db, "products"), orderBy("createdAt", "desc"), limit(INITIAL_PRODUCTS_LIMIT + 1))
                );
                const docs = productsSnapshot.docs;
                const hasMore = docs.length > INITIAL_PRODUCTS_LIMIT;
                const productDocs = hasMore ? docs.slice(0, INITIAL_PRODUCTS_LIMIT) : docs;
                const productsList = productDocs.map(d => ({ id: d.id, ...d.data() } as Product));
                const lastDoc = productDocs.length > 0 ? productDocs[productDocs.length - 1] : null;
                setProducts(productsList);
                setLastProductDoc(lastDoc);
                setHasMoreProducts(hasMore);
                setProductsLoading(false);
            } else {
                const productsSnapshot = await getDocs(
                    query(collection(db, "products"), orderBy("createdAt", "desc"), startAfter(lastProductDoc!), limit(INITIAL_PRODUCTS_LIMIT + 1))
                );
                const docs = productsSnapshot.docs;
                const hasMore = docs.length > INITIAL_PRODUCTS_LIMIT;
                const productDocs = hasMore ? docs.slice(0, INITIAL_PRODUCTS_LIMIT) : docs;
                const newProducts = productDocs.map(d => ({ id: d.id, ...d.data() } as Product));
                const lastDoc = productDocs.length > 0 ? productDocs[productDocs.length - 1] : null;
                setProducts(prev => [...prev, ...newProducts]);
                setLastProductDoc(lastDoc);
                setHasMoreProducts(hasMore);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(loadMore ? "Failed to load more" : "Failed to load products");
        } finally {
            if (!loadMore) setProductsLoading(false);
            setLoading(false);
            setLoadingMoreProducts(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        setUploading(true);
        const uploadingToast = toast.loading(`Uploading ${files.length} image(s)...`);

        try {
            const uploads = files.map(async (file): Promise<string> => {
                const isImage = file.type.startsWith("image/");
                let data: Blob | File = file;
                let contentType = file.type || "image/jpeg";
                let ext = (file.name.match(/\.([^.]+)$/)?.[1] || "jpg").toLowerCase();
                if (ext === "heic" || ext === "heif") ext = "jpg";

                try {
                    const compressed = await compressImage(file, { maxSizeBytes: 300 * 1024, maxDimension: 1200 });
                    data = compressed;
                    contentType = compressed.type || file.type || "image/jpeg";
                    ext = compressed.type === "image/webp" ? "webp" : "jpg";
                } catch {
                    if (!isImage) throw new Error("Please select image files (e.g. JPG, PNG, WebP).");
                }

                const name = (file.name.replace(/\.[^.]+$/, "") || "image") + "." + ext;
                const storageRef = ref(storage, `products/${Date.now()}_${name}`);
                const metadata: UploadMetadata = { contentType };
                const uploadTask = await uploadBytesResumable(storageRef, data, metadata);
                return await getDownloadURL(uploadTask.ref);
            });

            const urls = await Promise.all(uploads);
            setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
            toast.success(`${urls.length} image(s) uploaded`, { id: uploadingToast });
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const err = error as { code?: string; message?: string };
            const code = err?.code ?? "";
            const message = (err?.message ?? "").toLowerCase();
            const isPermission = code === "storage/unauthorized" || code === "storage/retry-limit-exceeded"
                || message.includes("permission") || message.includes("unauthorized") || message.includes("denied");
            if (isPermission) {
                toast.error(
                    "Upload denied: your account must be in the Admins list. In the project folder run: npm run add-admin -- your@email.com then log in again.",
                    { id: uploadingToast, duration: 8000 }
                );
            } else {
                toast.error(err?.message ?? "Failed to upload images", { id: uploadingToast });
            }
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setForm(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }));
    };

    const addImageByUrl = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        const raw = imageUrlInput.trim();
        if (!raw) {
            toast.error("Paste one or more image URLs first");
            return;
        }
        const parts = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        const urls: string[] = [];
        for (const part of parts) {
            let url = part.replace(/\s+/g, "");
            if (!url) continue;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                if (url.includes(".") && !url.startsWith(".")) url = "https://" + url;
                else continue;
            }
            try {
                new URL(url);
                urls.push(url);
            } catch {
                // skip invalid
            }
        }
        if (urls.length === 0) {
            toast.error("Enter valid URLs (one per line or comma-separated)");
            return;
        }
        setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
        setImageUrlInput("");
        toast.success(`${urls.length} image URL(s) added`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name?.trim() || !form.categoryId) {
            toast.error("Name and Category are required");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Saving product...");

        try {
            const productData = {
                productCode: (form.productCode || "").trim() || undefined,
                name: form.name,
                brandId: form.brandId || undefined,
                categoryId: form.categoryId,
                size: form.size || "",
                finish: form.finish || "",
                description: form.description || "",
                images: form.images || [],
                featured: form.featured || false,
                status: form.status || "active",
            };

            if (form.id) {
                await updateDoc(doc(db, "products", form.id), {
                    ...productData,
                    updatedAt: serverTimestamp()
                });
                toast.success("Product updated successfully", { id: toastId });
                setProducts(prev => prev.map(p => p.id === form.id ? { ...p, ...productData } : p));
            } else {
                const ref = await addDoc(collection(db, "products"), {
                    ...productData,
                    createdAt: serverTimestamp()
                });
                const newProduct: Product = {
                    ...productData,
                    id: ref.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                } as Product;
                setProducts(prev => [newProduct, ...prev]);
                toast.success("Product added successfully", { id: toastId });
            }
            setIsModalOpen(false);
            if (form.id) fetchData(false);
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error("Failed to save product", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        const toastId = toast.loading("Deleting product...");

        try {
            await deleteDoc(doc(db, "products", deleteId));
            setProducts(products.filter(p => p.id !== deleteId));
            toast.success("Product deleted successfully", { id: toastId });
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete product", { id: toastId });
        } finally {
            setDeleteId(null);
            setLoading(false);
        }
    };

    const handleDeleteAllProducts = async () => {
        setDeletingAll(true);
        const toastId = toast.loading("Deleting all products...");
        try {
            const count = await deleteAllProducts();
            setProducts([]);
            setLastProductDoc(null);
            setHasMoreProducts(false);
            setDeleteAllModalOpen(false);
            toast.success(`${count} product${count !== 1 ? "s" : ""} deleted`, { id: toastId });
            cache.invalidate("products");
        } catch (error) {
            console.error("Delete all error:", error);
            toast.error("Failed to delete all products", { id: toastId });
        } finally {
            setDeletingAll(false);
        }
    };

    const toggleStatus = useCallback(async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "hidden" : "active";
        try {
            await updateDoc(doc(db, "products", id), { status: newStatus });
            setProducts((prev) => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
            toast.success(`Product ${newStatus === "active" ? "unhidden" : "hidden"} successfully`);
        } catch {
            toast.error("Failed to update status");
        }
    }, []);

    const getCategoryName = useCallback((id: string) => categories.find(c => c.id === id)?.name || "—", [categories]);
    const getBrandName = useCallback((id: string) => (id ? brands.find(b => b.id === id)?.name || "—" : "—"), [brands]);
    const handleEditProduct = useCallback((p: Product) => { setForm(p); setIsModalOpen(true); }, []);
    const handleDeleteClick = useCallback((id: string) => setDeleteId(id), []);

    const handleExportCsv = () => {
        const headers = ["product_code", "product_name", "category", "brand", "size", "finish", "featured", "description", "image_url"];
        const rows = filteredProducts.map(p => [
            p.productCode ?? "",
            p.name,
            getCategoryName(p.categoryId),
            getBrandName(p.brandId ?? ""),
            p.size ?? "",
            p.finish ?? "",
            p.featured ? "1" : "0",
            (p.description ?? "").replace(/"/g, '""'),
            (p.images && p.images[0]) ? p.images[0] : "",
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
    };

    const filteredProducts = useMemo(() => {
        let list = products;
        if (debouncedSearch.trim()) {
            const term = debouncedSearch.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    (p.productCode || "").toLowerCase().includes(term)
            );
        }
        if (filterCategoryId) list = list.filter((p) => p.categoryId === filterCategoryId);
        if (filterBrandId) list = list.filter((p) => (p.brandId ?? "") === filterBrandId);
        return list;
    }, [products, debouncedSearch, filterCategoryId, filterBrandId]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / TABLE_PAGE_SIZE));
    const paginatedProducts = useMemo(
        () =>
            filteredProducts.slice(
                (tablePage - 1) * TABLE_PAGE_SIZE,
                tablePage * TABLE_PAGE_SIZE
            ),
        [filteredProducts, tablePage]
    );

    useEffect(() => {
        setTablePage(1);
    }, [debouncedSearch, filterCategoryId, filterBrandId]);

    const openModalForAdd = () => {
        setForm({
            id: "",
            productCode: "",
            name: "",
            brandId: "",
            categoryId: "",
            size: "",
            finish: "",
            description: "",
            images: [],
            featured: false,
            status: "active"
        });
        setIsModalOpen(true);
    };

    const BULK_JSON_TEMPLATE = {
        products: [
            { productCode: "KAJ-001", name: "Product 1", category: "Ceramic Tiles", brand: "Kajaria", size: "60x60 cm", finish: "Glossy", image: "https://example.com/image1.jpg" },
            { productCode: "KAJ-002", name: "Product 2", category: "Ceramic Tiles", brand: "Kajaria", size: "30x30 cm", finish: "Matt", images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"] },
        ],
    };

    const handleBulkImport = async () => {
        setBulkError("");
        let parsed: { products: Array<{
            productCode?: string;
            name: string;
            category?: string;
            categoryId?: string;
            brand?: string;
            brandId?: string;
            size?: string;
            finish?: string;
            image?: string;
            images?: string[] | string;
            imageCount?: number;
            imageUrls?: string[];
        }> };
        try {
            parsed = JSON.parse(bulkJsonText);
        } catch {
            setBulkError("Invalid JSON. Check the format.");
            return;
        }
        if (!parsed.products || !Array.isArray(parsed.products) || parsed.products.length === 0) {
            setBulkError("JSON must have a 'products' array with at least one product.");
            return;
        }
        const brandByName = new Map(brands.map((b) => [b.name.toLowerCase().trim(), b.id]));
        const categoryIds = new Set(categories.map((c) => c.id));
        const brandIds = new Set(brands.map((b) => b.id));
        const partnerBrandNamesLower = new Set(PARTNER_BRAND_NAMES.map((n) => n.toLowerCase().trim()));
        for (let i = 0; i < parsed.products.length; i++) {
            const p = parsed.products[i];
            if (!p.name?.trim()) {
                setBulkError(`Product at index ${i}: "name" is required.`);
                return;
            }
            if (!p.category?.trim() && !p.categoryId) {
                setBulkError(`Product "${p.name}": "category" or "categoryId" is required.`);
                return;
            }
            if (p.categoryId && !categoryIds.has(p.categoryId)) {
                setBulkError(`Product "${p.name}": categoryId "${p.categoryId}" not found.`);
                return;
            }
            // Category by name: created during import if missing
            const brandId = p.brandId ?? (p.brand ? brandByName.get(p.brand.trim().toLowerCase()) : undefined) ?? undefined;
            if (p.brand && !p.brandId && !brandId && !partnerBrandNamesLower.has(p.brand.trim().toLowerCase())) {
                setBulkError(`Product "${p.name}": brand "${p.brand}" not found. Use an existing brand name or leave empty.`);
                return;
            }
            if (p.brandId && !brandIds.has(p.brandId)) {
                setBulkError(`Product "${p.name}": brandId "${p.brandId}" not found.`);
                return;
            }
        }

        setBulkImporting(true);
        const toastId = toast.loading("Importing products...");
        const CHUNK_SIZE = 50; // Process in chunks to avoid timeouts; Firestore batch max 500
        try {
            let imageUrls: string[] = [];
            if (bulkImageFiles.length > 0) {
                try {
                    const uploads = bulkImageFiles.map(async (file) => {
                        const storageRef = ref(storage, `products/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`);
                        const metadata: UploadMetadata = { contentType: file.type || "image/jpeg" };
                        const uploadTask = await uploadBytesResumable(storageRef, file, metadata);
                        return getDownloadURL(uploadTask.ref);
                    });
                    imageUrls = await Promise.all(uploads);
                } catch (err: unknown) {
                    const code = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : "";
                    if (code === "storage/unauthorized" || (err as { message?: string })?.message?.includes("permission")) {
                        toast.error("Image upload denied. You must be logged in as admin.", { id: toastId });
                    } else {
                        toast.error("Failed to upload image files.", { id: toastId });
                    }
                    setBulkImporting(false);
                    return;
                }
            }

            let imageIndex = 0;
            let createdCount = 0;
            let updatedCount = 0;
            const categoryByNameMutable = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c.id]));
            const brandByNameMutable = new Map(brands.map((b) => [b.name.toLowerCase().trim(), b.id]));
            const total = parsed.products.length;

            for (let start = 0; start < total; start += CHUNK_SIZE) {
                const chunk = parsed.products.slice(start, start + CHUNK_SIZE);
                // 1. Resolve category and brand for each product in chunk (create if needed)
                for (const p of chunk) {
                    const categoryId = p.categoryId && categoryIds.has(p.categoryId)
                        ? p.categoryId
                        : (p.category?.trim() ? categoryByNameMutable.get(p.category.trim().toLowerCase()) : undefined);
                    if (p.category?.trim() && !categoryId) {
                        const categoryName = p.category.trim();
                        const catRef = await addDoc(collection(db, "categories"), {
                            name: categoryName,
                            description: "",
                            createdAt: serverTimestamp(),
                        });
                        categoryByNameMutable.set(categoryName.toLowerCase(), catRef.id);
                        categoryIds.add(catRef.id);
                    }
                    let brandId = p.brandId ?? (p.brand ? brandByNameMutable.get(p.brand.trim().toLowerCase()) : undefined) ?? undefined;
                    if (p.brand?.trim() && !brandId && partnerBrandNamesLower.has(p.brand.trim().toLowerCase())) {
                        const brandRef = await addDoc(collection(db, "brands"), {
                            name: p.brand.trim(),
                            logo: "",
                            description: "",
                            status: "active",
                            createdAt: serverTimestamp(),
                        });
                        brandByNameMutable.set(p.brand.trim().toLowerCase(), brandRef.id);
                        brandId = brandRef.id;
                    }
                }

                // 2. Build payloads and resolve existing refs in parallel for this chunk
                const payloads: Array<{ payload: Record<string, unknown>; productCode: string; productName: string; categoryId: string }> = [];
                for (const p of chunk) {
                    const categoryId = p.categoryId && categoryIds.has(p.categoryId)
                        ? p.categoryId
                        : (p.category?.trim() ? categoryByNameMutable.get(p.category.trim().toLowerCase()) : undefined)!;
                    const brandId = p.brandId ?? (p.brand ? brandByNameMutable.get(p.brand.trim().toLowerCase()) : undefined) ?? undefined;
                    let productImages: string[] = [];
                    const singleImage = (p as { image?: string; imageUrl?: string; image_url?: string }).image?.trim()
                        || (p as { imageUrl?: string }).imageUrl?.trim()
                        || (p as { image_url?: string }).image_url?.trim();
                    if (singleImage) {
                        productImages = [singleImage];
                    } else if (p.images) {
                        productImages = Array.isArray(p.images)
                            ? p.images.filter((u) => typeof u === "string" && u.trim())
                            : String(p.images).split(",").map((u) => u.trim()).filter(Boolean);
                    } else if (p.imageUrls?.length) {
                        productImages = p.imageUrls;
                    } else {
                        const imageCount = Math.max(0, p.imageCount ?? 1);
                        productImages = imageUrls.slice(imageIndex, imageIndex + imageCount).filter(Boolean);
                        imageIndex += imageCount;
                    }
                    const productCode = (p.productCode || "").trim();
                    const productNameFromCsv = (p.name ?? "").trim();
                    payloads.push({
                        productCode,
                        productName: productNameFromCsv,
                        categoryId,
                        payload: {
                            productCode: productCode || undefined,
                            name: productNameFromCsv,
                            brandId: brandId || undefined,
                            categoryId,
                            size: (p.size || "").trim() || "",
                            finish: (p.finish || "").trim() || "",
                            description: "",
                            images: productImages,
                            featured: false,
                            status: "active",
                        },
                    });
                }

                // 3. Match existing only by name+categoryId (productCode is not unique; same code can be used for multiple products)
                const existingByNameRefs = await Promise.all(
                    payloads.map(async (item) => {
                        const snap = await getDocs(
                            query(collection(db, "products"), where("categoryId", "==", item.categoryId), limit(200))
                        );
                        const match = snap.docs.find((d) => (d.data().name as string)?.trim() === item.productName);
                        return match?.ref ?? null;
                    })
                );

                // 4. Single batch write for this chunk
                const batch = writeBatch(db);
                for (let i = 0; i < payloads.length; i++) {
                    const existingRef = existingByNameRefs[i];
                    const { payload } = payloads[i];
                    if (existingRef) {
                        batch.update(existingRef, payload);
                        updatedCount += 1;
                    } else {
                        const newRef = doc(collection(db, "products"));
                        batch.set(newRef, { ...payload, createdAt: serverTimestamp() });
                        createdCount += 1;
                    }
                }
                await batch.commit();
                const done = Math.min(start + CHUNK_SIZE, total);
                toast.loading(`Importing... (${done}/${total})`, { id: toastId });
            }

            const msg = updatedCount > 0
                ? `${total} rows: ${createdCount} created, ${updatedCount} updated (matched by name+category).`
                : `${total} product(s) imported.`;
            toast.success(msg, { id: toastId });
            setBulkModalOpen(false);
            setBulkJsonText("");
            setBulkImageFiles([]);
            fetchData(false);
        } catch (err) {
            console.error("Bulk import error:", err);
            toast.error("Bulk import failed.", { id: toastId });
            setBulkError(err instanceof Error ? err.message : "Import failed");
        } finally {
            setBulkImporting(false);
        }
    };

    const fetchFromGoogleSheet = async () => {
        const url = bulkSheetUrl.trim();
        if (!url) {
            setBulkError("Paste the Google Sheet CSV link first.");
            return;
        }
        setBulkError("");
        setBulkFetchingSheet(true);
        try {
            const res = await fetch(`/api/fetch-csv?url=${encodeURIComponent(url)}`);
            const text = await res.text();
            if (!res.ok) {
                const err = text.startsWith("{") ? JSON.parse(text)?.error : text;
                setBulkError(err || "Failed to fetch. Publish the sheet as CSV (File → Share → Publish to web).");
                return;
            }
            const { products } = parseCsvToProducts(text);
            if (!products.length) {
                setBulkError("No products in the sheet. Check headers: productCode, name, category, brand, size, finish, image.");
                return;
            }
            setBulkJsonText(JSON.stringify({ products }, null, 2));
            toast.success(`Loaded ${products.length} product(s) from sheet. Click Import to save.`);
        } catch (e) {
            setBulkError(e instanceof Error ? e.message : "Failed to fetch sheet");
        } finally {
            setBulkFetchingSheet(false);
        }
    };

    const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
        if (file.size > 10 * 1024 * 1024) {
            setBulkError("File is very large (>10 MB). Use a smaller CSV or paste JSON directly.");
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result ?? "");
            if (isCsv) {
                try {
                    const { products } = parseCsvToProducts(text);
                    setBulkJsonText(JSON.stringify({ products }, null, 2));
                    setBulkError("");
                    if (products.length > 100) {
                        toast.success(`${products.length} products loaded. Import runs in chunks; wait for "Importing... (n/n)" to finish.`);
                    }
                } catch {
                    setBulkError("Invalid CSV. Use headers: productCode, name, category, brand, size, finish, image (or images).");
                }
            } else {
                setBulkJsonText(text);
            }
        };
        reader.readAsText(file, "UTF-8");
        e.target.value = "";
    };

    return (
        <div className="flex flex-col min-h-0 bg-slate-50">
                <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Products Management</h1>
                    <p className="text-slate-500">Manage your product catalog and inventory.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setDeleteAllModalOpen(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors duration-200 active:scale-[0.98]"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Delete all</span>
                    </button>
                    <button type="button" onClick={handleExportCsv} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors duration-200 active:scale-[0.98]">
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setBulkModalOpen(true); setBulkError(""); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors duration-200 active:scale-[0.98]"
                    >
                        <Upload className="w-5 h-5" />
                        <span className="hidden sm:inline">Bulk Import</span>
                    </button>
                    <button
                        type="button"
                        onClick={openModalForAdd}
                        className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center bg-card px-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm transition-[border-color,box-shadow] duration-200 bg-background text-foreground"
                        />
                    </div>
                    <select
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                        className="px-4 py-2 border border-input rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-[border-color,box-shadow] duration-200"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterBrandId}
                        onChange={(e) => setFilterBrandId(e.target.value)}
                        className="px-4 py-2 border border-input rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-ring transition-[border-color,box-shadow] duration-200"
                    >
                        <option value="">All brands</option>
                        {brands.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div ref={tableScrollRef} className="min-h-0">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <th className="p-4 pl-6 w-28">product code</th>
                                <th className="p-4">name</th>
                                <th className="p-4">category</th>
                                <th className="p-4">brand</th>
                                <th className="p-4">size</th>
                                <th className="p-4">finish</th>
                                <th className="p-4 w-20">image</th>
                                <th className="p-4">Visible</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productsLoading && products.length === 0 ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border">
                                        <td className="p-4 pl-6"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-4"><Skeleton className="w-12 h-12 rounded-xl" /></td>
                                        <td className="p-4"><Skeleton className="h-8 w-14 rounded-full" /></td>
                                        <td className="p-4 pr-6"><Skeleton className="h-8 w-16 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-muted-foreground font-medium">
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((p) => (
                                    <ProductTableRow
                                        key={p.id}
                                        p={p}
                                        getCategoryName={getCategoryName}
                                        getBrandName={getBrandName}
                                        onEdit={handleEditProduct}
                                        onDelete={handleDeleteClick}
                                        onToggleStatus={toggleStatus}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {(filteredProducts.length > TABLE_PAGE_SIZE || hasMoreProducts) && !productsLoading && (
                    <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-card">
                        <div className="flex items-center gap-4">
                            {filteredProducts.length > TABLE_PAGE_SIZE && (
                                <p className="text-sm text-muted-foreground">
                                    Page {tablePage} of {totalPages}
                                </p>
                            )}
                            {hasMoreProducts && (
                                <button
                                    type="button"
                                    onClick={() => fetchData(false, true)}
                                    disabled={loadingMoreProducts}
                                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loadingMoreProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Load more products
                                </button>
                            )}
                        </div>
                        {filteredProducts.length > TABLE_PAGE_SIZE && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        startTransition(() => setTablePage((p) => Math.max(1, p - 1)));
                                        tableScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
                                    }}
                                    disabled={tablePage <= 1}
                                    className="p-2 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        startTransition(() => setTablePage((p) => Math.min(totalPages, p + 1)));
                                        tableScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
                                    }}
                                    disabled={tablePage >= totalPages}
                                    className="p-2 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex flex-col items-center justify-end sm:justify-center sm:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900">{form.id ? "Edit Product" : "Add New Product"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form className="p-6 overflow-y-auto flex-1 flex flex-col gap-6" id="productForm">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Product Code</label>
                                    <input type="text" value={form.productCode ?? ""} onChange={e => setForm({ ...form, productCode: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900" placeholder="e.g. KAJ-001" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name * (exact from CSV &quot;name&quot; column, not brand)</label>
                                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900" placeholder="e.g. Rockstrong, ball valve (product name from CSV)" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
                                    <select required value={form.categoryId || ""} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900">
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Brand</label>
                                    <select value={form.brandId ?? ""} onChange={e => setForm({ ...form, brandId: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900">
                                        <option value="">No brand</option>
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Size</label>
                                    <input type="text" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900" placeholder="e.g. 60x60 cm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Finish</label>
                                    <input type="text" value={form.finish} onChange={e => setForm({ ...form, finish: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900" placeholder="e.g. Glossy" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300" />
                                    <span className="font-semibold text-slate-700 flex flex-col">
                                        <span>Featured Product</span>
                                        <span className="text-xs text-slate-500 font-normal">Show on the homepage slider</span>
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 resize-none" placeholder="Detailed description of the product..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Images</label>
                                <p className="text-xs text-slate-500 mb-2">Paste an image URL below and click <strong>Add URL</strong>, then <strong>Save Product</strong>. (Upload requires Firebase Storage.)</p>
                                <div className="flex flex-wrap gap-4">
                                    {form.images?.map((img, idx) => (
                                        <FormImageThumb key={idx} url={img} onRemove={() => removeImage(idx)} />
                                    ))}
                                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <ImagePlus className="w-6 h-6 mb-1 text-slate-400" />}
                                        <span className="text-xs font-semibold">Upload</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        inputMode="url"
                                        autoComplete="off"
                                        value={imageUrlInput}
                                        onChange={e => setImageUrlInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addImageByUrl();
                                            }
                                        }}
                                        placeholder="Paste one or more URLs (one per line or comma-separated)"
                                        className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={e => addImageByUrl(e)}
                                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/30"
                                    >
                                        Add URL
                                    </button>
                                </div>
                            </div>

                        </form>

                        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                            <button onClick={handleSubmit} disabled={loading || uploading} className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100">
                                {loading ? "Saving..." : "Save Product"}
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
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Product?</h3>
                            <p className="text-slate-500">Are you sure you want to delete this product? This action cannot be undone.</p>
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

            {/* Delete all products modal */}
            {deleteAllModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete all products?</h3>
                            <p className="text-slate-500">This will permanently delete every product in the catalog. This action cannot be undone.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => !deletingAll && setDeleteAllModalOpen(false)}
                                disabled={deletingAll}
                                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAllProducts}
                                disabled={deletingAll}
                                className="px-4 py-2 font-medium text-white bg-foreground hover:bg-foreground/90 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {deletingAll ? "Deleting..." : "Delete all"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {bulkModalOpen && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FileJson className="w-6 h-6" />
                                Bulk Import Products
                            </h2>
                            <button type="button" onClick={() => setBulkModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-600 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <p className="text-sm text-slate-600">
                                Upload a <strong>CSV</strong> or <strong>JSON</strong> file, or use a <strong>Google Sheet</strong>. Each product needs <strong>name</strong> and <strong>category</strong>. Optional: <strong>productCode</strong>, <strong>brand</strong>, <strong>size</strong>, <strong>finish</strong>, <strong>image</strong> (full URL or Google Drive link). You can also attach image files below (assigned in order) if you use Firebase Storage.
                            </p>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Import from Google Sheet</label>
                                <p className="text-xs text-slate-500">In Google Sheets: File → Share → Publish to web → Link tab → choose <strong>Comma-separated values (.csv)</strong> → Publish, then copy the link and paste below.</p>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="url"
                                        value={bulkSheetUrl}
                                        onChange={e => { setBulkSheetUrl(e.target.value); setBulkError(""); }}
                                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                                        className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={fetchFromGoogleSheet}
                                        disabled={bulkFetchingSheet || !bulkSheetUrl.trim()}
                                        className="px-4 py-2 rounded-xl bg-slate-200 text-slate-900 hover:bg-slate-300 font-medium text-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
                                    >
                                        {bulkFetchingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        Fetch from Sheet
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 hover:bg-slate-300 rounded-xl text-sm font-medium cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4" />
                                    Choose CSV or JSON file
                                    <input type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={handleBulkFile} />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(BULK_JSON_TEMPLATE, null, 2)], { type: "application/json" });
                                        const a = document.createElement("a");
                                        a.href = URL.createObjectURL(blob);
                                        a.download = "products-import-template.json";
                                        a.click();
                                        URL.revokeObjectURL(a.href);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 hover:bg-slate-300 rounded-xl text-sm font-medium transition-colors"
                                >
                                    JSON template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const csv = "productCode,name,category,brand,size,finish,image\nKAJ-001,Product 1,Ceramic Tiles,Kajaria,60x60 cm,Glossy,https://example.com/image1.jpg\nKAJ-002,Product 2,Ceramic Tiles,Kajaria,30x30 cm,Matt,https://example.com/img1.jpg";
                                        const blob = new Blob([csv], { type: "text/csv" });
                                        const a = document.createElement("a");
                                        a.href = URL.createObjectURL(blob);
                                        a.download = "products-import-template.csv";
                                        a.click();
                                        URL.revokeObjectURL(a.href);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 hover:bg-slate-300 rounded-xl text-sm font-medium transition-colors"
                                >
                                    CSV template
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Products (from file or paste JSON)</label>
                                <textarea
                                    value={bulkJsonText}
                                    onChange={(e) => setBulkJsonText(e.target.value)}
                                    placeholder='Upload a CSV/JSON file or paste: {"products":[{"name":"Product 1","category":"Ceramic Tiles","brand":"Kajaria",...}]}'
                                    rows={10}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 resize-y"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Bulk image upload (optional)</label>
                                <p className="text-xs text-slate-500 mb-2">Select image files in the same order as your products. 1st file → 1st product, 2nd file → 2nd product. Only used for rows that have no image/URL in the file.</p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setBulkImageFiles(Array.from(e.target.files || []))}
                                    className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-semibold"
                                />
                                {bulkImageFiles.length > 0 && (
                                    <p className="mt-2 text-sm text-slate-500">{bulkImageFiles.length} image(s) selected. Will assign in order to products that don’t have an image in the CSV/JSON.</p>
                                )}
                            </div>
                            {bulkError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{bulkError}</p>}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button type="button" onClick={() => setBulkModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkImport}
                                disabled={bulkImporting || !bulkJsonText.trim()}
                                className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {bulkImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                {bulkImporting ? "Importing..." : "Import"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
