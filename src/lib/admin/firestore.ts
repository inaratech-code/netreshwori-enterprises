import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type QueryConstraint,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Brand, Category, Product, Inquiry, Testimonial, AnalyticsEvent, Settings, MediaItem } from "./types";

const COLLECTIONS = {
  brands: "brands",
  categories: "categories",
  products: "products",
  inquiries: "inquiries",
  testimonials: "testimonials",
  analytics_events: "analytics_events",
  settings: "settings",
  media: "media",
} as const;

// ---- Brands ----
export const brandsCol = () => collection(db, COLLECTIONS.brands);
export async function getBrands(): Promise<Brand[]> {
  const snap = await getDocs(query(brandsCol(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Brand));
}
export async function createBrand(data: Omit<Brand, "id">): Promise<string> {
  const ref = await addDoc(brandsCol(), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateBrand(id: string, data: Partial<Brand>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.brands, id), data);
}
export async function deleteBrand(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.brands, id));
}

/** Returns product count per brand id (brandId -> count). */
export async function getProductCountsByBrandIds(brandIds: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await Promise.all(
    brandIds.map(async (id) => {
      const snap = await getDocs(query(productsCol(), where("brandId", "==", id)));
      counts[id] = snap.size;
    })
  );
  return counts;
}

// ---- Categories ----
export const categoriesCol = () => collection(db, COLLECTIONS.categories);
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(query(categoriesCol(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}
export async function createCategory(data: Omit<Category, "id">): Promise<string> {
  const ref = await addDoc(categoriesCol(), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.categories, id), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.categories, id));
}
export async function countProductsByCategory(categoryId: string): Promise<number> {
  const snap = await getDocs(query(collection(db, COLLECTIONS.products), where("categoryId", "==", categoryId), limit(1)));
  if (snap.empty) return 0;
  const full = await getDocs(query(collection(db, COLLECTIONS.products), where("categoryId", "==", categoryId)));
  return full.size;
}

// ---- Products ----
export const productsCol = () => collection(db, COLLECTIONS.products);
export async function getProducts(constraints: QueryConstraint[] = []): Promise<Product[]> {
  const q = query(productsCol(), ...(constraints.length ? constraints : [orderBy("createdAt", "desc")]));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

const PRODUCTS_PAGE_SIZE = 12;

export interface ProductsPageResult {
  products: Product[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export interface ProductsPaginatedFilters {
  categoryId?: string;
  brandId?: string;
  size?: string;
  finish?: string;
}

/** Paginated products for public listing. Optional filters: categoryId, brandId, size, finish. */
export async function getProductsPaginated(
  pageSize: number = PRODUCTS_PAGE_SIZE,
  lastDocument?: DocumentSnapshot | null,
  filters?: ProductsPaginatedFilters
): Promise<ProductsPageResult> {
  const constraints: QueryConstraint[] = [];
  if (filters?.categoryId) {
    constraints.push(where("categoryId", "==", filters.categoryId));
  }
  if (filters?.brandId) {
    constraints.push(where("brandId", "==", filters.brandId));
  }
  if (filters?.size?.trim()) {
    constraints.push(where("size", "==", filters.size.trim()));
  }
  if (filters?.finish?.trim()) {
    constraints.push(where("finish", "==", filters.finish.trim()));
  }
  constraints.push(where("status", "==", "active"));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageSize + 1));
  if (lastDocument) {
    constraints.push(startAfter(lastDocument));
  }
  const q = query(productsCol(), ...constraints);
  try {
    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const list = (hasMore ? docs.slice(0, pageSize) : docs).map((d) => ({ id: d.id, ...d.data() } as Product));
    const lastDoc = list.length > 0 ? (hasMore ? docs[pageSize - 1] : docs[docs.length - 1]) : null;
    return {
      products: list,
      lastDoc: lastDoc ?? null,
      hasMore,
    };
  } catch (err) {
    console.warn("Products query failed (deploy firestore indexes?). Falling back to client-side filtering.", err);
    try {
      const fallbackQ = query(
        productsCol(),
        where("status", "==", "active"),
        limit(1000)
      );
      const snap = await getDocs(fallbackQ);
      let docs = snap.docs;
      if (filters?.categoryId || filters?.brandId || filters?.size?.trim() || filters?.finish?.trim()) {
        docs = docs.filter((d) => {
          const d_ = d.data();
          if (filters!.categoryId && d_.categoryId !== filters.categoryId) return false;
          if (filters!.brandId && d_.brandId !== filters.brandId) return false;
          if (filters!.size?.trim() && (d_.size ?? "").trim() !== filters.size!.trim()) return false;
          if (filters!.finish?.trim() && (d_.finish ?? "").trim() !== filters.finish!.trim()) return false;
          return true;
        });
      }
      docs = [...docs].sort((a, b) => {
        const aT = (a.data().createdAt as number | undefined) ?? 0;
        const bT = (b.data().createdAt as number | undefined) ?? 0;
        return bT - aT;
      });
      const list = docs.slice(0, pageSize).map((d) => ({ id: d.id, ...d.data() } as Product));
      const lastDoc = list.length > 0 ? docs[Math.min(pageSize, docs.length) - 1] : null;
      return {
        products: list,
        lastDoc: lastDoc ?? null,
        hasMore: false,
      };
    } catch (fallbackErr) {
      console.error("Fallback products query failed:", fallbackErr);
      return { products: [], lastDoc: null, hasMore: false };
    }
  }
}

/** Similar products (same category, optionally same brand), excluding the given product id. */
export async function getSimilarProducts(
  excludeProductId: string,
  categoryId: string,
  options?: { brandId?: string; limit?: number }
): Promise<Product[]> {
  const limitCount = Math.min(options?.limit ?? 8, 20);
  try {
    const q = query(
      productsCol(),
      where("categoryId", "==", categoryId),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const snap = await getDocs(q);
    let list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .filter((p) => p.id !== excludeProductId)
      .slice(0, limitCount);
    if (options?.brandId) {
      const withBrand = list.filter((p) => p.brandId === options.brandId);
      const without = list.filter((p) => p.brandId !== options.brandId);
      list = [...withBrand, ...without].slice(0, limitCount);
    }
    return list;
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.products, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
}

/** Find product id by productCode (for bulk import upsert). Returns null if not found. */
export async function getProductIdByProductCode(productCode: string): Promise<string | null> {
  if (!productCode?.trim()) return null;
  const q = query(productsCol(), where("productCode", "==", productCode.trim()), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

export async function createProduct(data: Omit<Product, "id">): Promise<string> {
  const ref = await addDoc(productsCol(), {
    ...data,
    views: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.products, id), data);
}
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.products, id));
}

/** Delete all products in the collection. Returns the number deleted. */
export async function deleteAllProducts(): Promise<number> {
  const BATCH_SIZE = 500;
  let totalDeleted = 0;
  let last: DocumentSnapshot | null = null;
  for (;;) {
    const q = last
      ? query(productsCol(), orderBy("createdAt", "desc"), limit(BATCH_SIZE), startAfter(last))
      : query(productsCol(), orderBy("createdAt", "desc"), limit(BATCH_SIZE));
    const snap = await getDocs(q);
    if (snap.empty) break;
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COLLECTIONS.products, d.id))));
    totalDeleted += snap.docs.length;
    if (snap.docs.length < BATCH_SIZE) break;
    last = snap.docs[snap.docs.length - 1];
  }
  return totalDeleted;
}

// ---- Inquiries ----
export const inquiriesCol = () => collection(db, COLLECTIONS.inquiries);
export async function getInquiries(): Promise<Inquiry[]> {
  const snap = await getDocs(query(inquiriesCol(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry));
}
export async function createInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
}): Promise<string> {
  const ref = await addDoc(inquiriesCol(), {
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    message: data.message,
    subject: data.subject ?? "",
    productId: "", // required by Firestore rules; set when from product page
    status: "new",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateInquiry(id: string, data: Partial<Inquiry>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.inquiries, id), data);
}
export async function deleteInquiry(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.inquiries, id));
}

// ---- Testimonials ----
export const testimonialsCol = () => collection(db, COLLECTIONS.testimonials);
export async function getTestimonials(): Promise<Testimonial[]> {
  const snap = await getDocs(query(testimonialsCol(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial));
}
export async function createTestimonial(data: Omit<Testimonial, "id">): Promise<string> {
  const ref = await addDoc(testimonialsCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}
export async function updateTestimonial(id: string, data: Partial<Testimonial>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.testimonials, id), data);
}
export async function deleteTestimonial(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.testimonials, id));
}

// ---- Analytics ----
export const analyticsCol = () => collection(db, COLLECTIONS.analytics_events);
export async function logAnalyticsEvent(data: Omit<AnalyticsEvent, "id">): Promise<void> {
  await addDoc(analyticsCol(), { ...data, timestamp: serverTimestamp() });
}
export async function getAnalyticsEvents(dateFrom: string, dateTo: string, maxDocs = 2000): Promise<AnalyticsEvent[]> {
  try {
    const q = query(
      analyticsCol(),
      where("date", ">=", dateFrom),
      limit(maxDocs)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnalyticsEvent));
    return list.filter((e) => e.date <= dateTo).sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.warn("getAnalyticsEvents failed (index or permissions):", err);
    return [];
  }
}

// ---- Settings (single doc) ----
const SETTINGS_DOC_ID = "general";
export async function getSettings(): Promise<Settings | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID));
  return snap.exists() ? (snap.data() as Settings) : null;
}
export async function setSettings(data: Partial<Settings>): Promise<void> {
  const ref = doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID);
  await setDoc(ref, data, { merge: true });
}

// ---- Media ----
export const mediaCol = () => collection(db, COLLECTIONS.media);
export async function getMedia(): Promise<MediaItem[]> {
  const snap = await getDocs(query(mediaCol(), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem));
}
export async function addMediaItem(data: Omit<MediaItem, "id">): Promise<string> {
  const ref = await addDoc(mediaCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}
export async function deleteMediaItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.media, id));
}

export { COLLECTIONS };
