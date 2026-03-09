"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search, SlidersHorizontal, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { getProductsPaginated, getCategories, getBrands } from "@/lib/admin/firestore";
import type { Product, Category, Brand } from "@/lib/admin/types";
import { SIZE_FILTER_OPTIONS, FINISH_FILTER_OPTIONS } from "@/data/filterOptions";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 24;

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<import("firebase/firestore").DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const observerTarget = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      categoryId: selectedCategoryId ?? undefined,
      brandId: selectedBrandId ?? undefined,
      size: selectedSize ?? undefined,
      finish: selectedFinish ?? undefined,
    }),
    [selectedCategoryId, selectedBrandId, selectedSize, selectedFinish]
  );

  const loadFirstPage = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const result = await getProductsPaginated(PAGE_SIZE, null, {
          categoryId: selectedCategoryId ?? undefined,
          brandId: selectedBrandId ?? undefined,
          size: selectedSize ?? undefined,
          finish: selectedFinish ?? undefined,
        });
        setProducts(result.products);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch {
        setProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategoryId, selectedBrandId, selectedSize, selectedFinish]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const result = await getProductsPaginated(PAGE_SIZE, lastDoc, filters);
      setProducts((prev) => [...prev, ...result.products]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, lastDoc, loadingMore, filters]);

  useEffect(() => {
    getCategories().then(setCategories);
    getBrands().then(setBrands);
  }, []);

  // Resolve URL category param (can be category name from Explore Our Categories) to Firestore category id
  useEffect(() => {
    if (!categoryParam.trim() || categories.length === 0) return;
    const param = categoryParam.trim();
    const byId = categories.find((c) => c.id === param);
    const byName = categories.find((c) => c.name.trim().toLowerCase() === param.toLowerCase());
    const resolvedId = byId?.id ?? byName?.id ?? null;
    setSelectedCategoryId(resolvedId);
  }, [categoryParam, categories]);

  useEffect(() => {
    // When URL has category param, wait for categories to load so we can resolve name → id before first load
    if (categoryParam.trim() && categories.length === 0) return;
    setProducts([]);
    setLastDoc(null);
    setHasMore(true);
    loadFirstPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when filters/categories change
  }, [selectedCategoryId, selectedBrandId, selectedSize, selectedFinish, categoryParam, categories]);

  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) loadMore();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  // Predefined options from catalog; merge in any sizes/finishes from current products not in the list
  const sizeFilterOptions = useMemo(() => {
    const fromProducts = new Set<string>();
    products.forEach((p) => {
      const s = (p.size ?? "").trim();
      if (s) fromProducts.add(s);
    });
    const combined = new Set([...SIZE_FILTER_OPTIONS, ...Array.from(fromProducts)]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [products]);

  const finishFilterOptions = useMemo(() => {
    const fromProducts = new Set<string>();
    products.forEach((p) => {
      const f = (p.finish ?? "").trim();
      if (f) fromProducts.add(f);
    });
    const combined = new Set([...FINISH_FILTER_OPTIONS, ...Array.from(fromProducts)]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [products]);

  // Brand filter options: all brands sorted by name (brand name falls under the brand filter)
  const brandFilterOptions = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [brands]
  );

  const filteredBySearch = useMemo(() => {
    if (!debouncedSearch.trim()) return products;
    const term = debouncedSearch.toLowerCase();
    return products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const code = (p.productCode ?? "").toLowerCase();
      const categoryName = (categories.find((c) => c.id === p.categoryId)?.name ?? "").toLowerCase();
      const brandName = (brands.find((b) => b.id === (p.brandId ?? ""))?.name ?? "").toLowerCase();
      const size = (p.size ?? "").toLowerCase();
      const finish = (p.finish ?? "").toLowerCase();
      return (
        name.includes(term) ||
        code.includes(term) ||
        categoryName.includes(term) ||
        brandName.includes(term) ||
        size.includes(term) ||
        finish.includes(term)
      );
    });
  }, [products, debouncedSearch, categories, brands]);

  const cardProducts = useMemo(() => {
    return filteredBySearch.map((p) => {
      const images = Array.isArray(p.images)
        ? p.images
        : (p as { image?: string }).image
          ? [(p as { image?: string }).image!]
          : [];
      const categoryName = p.categoryId
        ? (categories.find((c) => c.id === p.categoryId)?.name ?? undefined)
        : undefined;
      const brandName = p.brandId
        ? (brands.find((b) => b.id === p.brandId)?.name ?? undefined)
        : undefined;
      return {
        id: p.id,
        name: p.name,
        productCode: p.productCode ?? "",
        brand: brandName,
        brandId: p.brandId,
        category: categoryName,
        categoryId: p.categoryId,
        images,
        inStock: p.status === "active",
        status: p.status,
      };
    });
  }, [filteredBySearch, categories, brands]);

  return (
    <div className="bg-brand-gradient min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Our Collection</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-2">
            Browse our catalog of premium tiles. Use filters to find what you need.
          </p>
          <p className="text-sm text-muted-foreground/90 italic">Subject to Availability.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 shrink-0">
            {/* Mobile: single "Filters" dropdown button that expands to show filter panel */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm text-left hover:bg-muted/50 transition-colors"
                aria-expanded={mobileFiltersOpen}
                aria-controls="mobile-filters-panel"
              >
                <span className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  Filters
                </span>
                {mobileFiltersOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
                )}
              </button>
              <div
                id="mobile-filters-panel"
                className={`overflow-hidden transition-[height] duration-200 ${mobileFiltersOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
                role="region"
                aria-label="Filter options"
              >
                <div className="bg-card mt-2 p-4 rounded-2xl border border-border shadow-sm space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Category</h3>
                    <div className="relative">
                      <select
                        value={selectedCategoryId ?? ""}
                        onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                        className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="">All</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Brand name</h3>
                    <div className="relative">
                      <select
                        value={selectedBrandId ?? ""}
                        onChange={(e) => setSelectedBrandId(e.target.value || null)}
                        className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="">All</option>
                        {brandFilterOptions.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Size</h3>
                    <div className="relative">
                      <select
                        value={selectedSize ?? ""}
                        onChange={(e) => setSelectedSize(e.target.value || null)}
                        className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="">All</option>
                        {sizeFilterOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Finish</h3>
                    <div className="relative">
                      <select
                        value={selectedFinish ?? ""}
                        onChange={(e) => setSelectedFinish(e.target.value || null)}
                        className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="">All</option>
                        {finishFilterOptions.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Desktop: always-visible sidebar */}
            <div className="hidden lg:block">
              <div className="bg-card p-6 rounded-2xl border border-border sticky top-24 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  Filters
                </h2>
                <div className="mb-8">
                  <h3 className="font-semibold text-foreground mb-4">Category</h3>
                  <div className="relative">
                    <select
                      value={selectedCategoryId ?? ""}
                      onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                      className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">All</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="font-semibold text-foreground mb-4">Brand name</h3>
                  <div className="relative">
                    <select
                      value={selectedBrandId ?? ""}
                      onChange={(e) => setSelectedBrandId(e.target.value || null)}
                      className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">All</option>
                      {brandFilterOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="font-semibold text-foreground mb-4">Size</h3>
                  <div className="relative">
                    <select
                      value={selectedSize ?? ""}
                      onChange={(e) => setSelectedSize(e.target.value || null)}
                      className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">All</option>
                      {sizeFilterOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Finish</h3>
                  <div className="relative">
                    <select
                      value={selectedFinish ?? ""}
                      onChange={(e) => setSelectedFinish(e.target.value || null)}
                      className="w-full appearance-none bg-muted border border-border rounded-xl pl-4 pr-10 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">All</option>
                      {finishFilterOptions.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-card p-4 rounded-2xl border border-border mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, category, brand, size, finish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-12">
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : (
                <>
                  {cardProducts.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={i < 6}
                      queryParams={{
                        category: selectedCategoryId ?? undefined,
                        brand: selectedBrandId ?? undefined,
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {!loading && (products.length > 0 || filteredBySearch.length > 0) && (
              <p className="col-span-full text-sm text-muted-foreground text-center -mt-2 mb-4">
                Showing {filteredBySearch.length} product{filteredBySearch.length !== 1 ? "s" : ""}
                {hasMore && " · Scroll down or click below to load more"}
              </p>
            )}

            {!loading && filteredBySearch.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <div className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-muted text-muted-foreground mb-6">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Try adjusting filters or search.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategoryId(null);
                    setSelectedBrandId(null);
                    setSelectedSize(null);
                    setSelectedFinish(null);
                  }}
                  className="bg-primary text-primary-foreground font-medium py-3 px-8 rounded-full hover:opacity-90 transition-opacity shadow-lg"
                >
                  Clear all filters
                </button>
              </div>
            )}

            <div ref={observerTarget} className="flex flex-col items-center justify-center py-8 min-h-[80px] gap-4">
              {hasMore && !loading && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Load more products"
                  )}
                </button>
              )}
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductsFallback() {
  return (
    <div className="bg-brand-gradient min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-5 w-96 mb-12" />
        <div className="flex gap-8">
          <Skeleton className="w-64 h-80 rounded-2xl shrink-0" />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsContent />
    </Suspense>
  );
}
