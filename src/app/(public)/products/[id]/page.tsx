"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronRight, Share2, Heart, MessageCircle, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getProduct, getCategories, getBrands, getSimilarProducts, getProductsPaginated } from "@/lib/admin/firestore";
import type { Product, Category, Brand } from "@/lib/admin/types";
import { resolveProductImageSrc, isProxyableImageUrl } from "@/lib/utils";
import ProductCard from "@/components/product/ProductCard";

const MORE_PRODUCTS_LIMIT = 8;
const MAGNIFIER_SIZE = 140;
const MAGNIFIER_ZOOM = 2.2;

function ImageMagnifier({ src, alt, className, onError }: { src: string; alt: string; className?: string; onError?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [container, setContainer] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainer({ width: rect.width, height: rect.height, left: rect.left, top: rect.top });
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setShow(true);
  };

  const handleMouseLeave = () => setShow(false);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full relative cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- magnifier image */}
      <img src={src} alt={alt} className={className} draggable={false} onError={onError} />
      {show && container.width > 0 && (
        <div
          className="pointer-events-none absolute z-10 rounded-full border-2 border-white bg-white/80 shadow-xl overflow-hidden"
          style={{
            width: MAGNIFIER_SIZE,
            height: MAGNIFIER_SIZE,
            left: Math.max(0, Math.min(pos.x - MAGNIFIER_SIZE / 2, container.width - MAGNIFIER_SIZE)),
            top: Math.max(0, Math.min(pos.y - MAGNIFIER_SIZE / 2, container.height - MAGNIFIER_SIZE)),
          }}
        >
          <div
            className="absolute rounded-full bg-cover bg-no-repeat"
            style={{
              width: container.width * MAGNIFIER_ZOOM,
              height: container.height * MAGNIFIER_ZOOM,
              left: -(pos.x * MAGNIFIER_ZOOM - MAGNIFIER_SIZE / 2),
              top: -(pos.y * MAGNIFIER_ZOOM - MAGNIFIER_SIZE / 2),
              backgroundImage: `url(${src})`,
              backgroundSize: `${container.width * MAGNIFIER_ZOOM}px ${container.height * MAGNIFIER_ZOOM}px`,
              backgroundPosition: "0 0",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [mainImageFailed, setMainImageFailed] = useState(false);
  const [moreProducts, setMoreProducts] = useState<Product[]>([]);
  const [moreProductsLoading, setMoreProductsLoading] = useState(false);

  useEffect(() => {
    setMainImageFailed(false);
  }, [activeImage]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    Promise.all([getProduct(id), getCategories(), getBrands()])
      .then(([p, cats, b]) => {
        if (cancelled) return;
        setProduct(p ?? null);
        setCategories(cats);
        setBrands(b);
        setNotFound(!p);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // More products: match user's filter (URL params) or current product's category/brand; fallback to any products
  useEffect(() => {
    if (!product?.id) {
      setMoreProducts([]);
      return;
    }
    setMoreProductsLoading(true);
    const categoryIdFromUrl = searchParams.get("category") ?? undefined;
    const brandIdFromUrl = searchParams.get("brand") ?? undefined;
    const categoryId = (categoryIdFromUrl || product.categoryId) ?? undefined;
    const brandId = (brandIdFromUrl || product.brandId) ?? undefined;

    if (categoryId) {
      getSimilarProducts(product.id, categoryId, { brandId, limit: MORE_PRODUCTS_LIMIT })
        .then((list) => {
          if (list.length > 0) {
            setMoreProducts(list);
            setMoreProductsLoading(false);
            return;
          }
          return getProductsPaginated(MORE_PRODUCTS_LIMIT + 4, null, {})
            .then((res) => res.products.filter((p) => p.id !== product.id).slice(0, MORE_PRODUCTS_LIMIT));
        })
        .then((fallback) => {
          if (Array.isArray(fallback)) {
            setMoreProducts(fallback);
          }
        })
        .catch(() => setMoreProducts([]))
        .finally(() => setMoreProductsLoading(false));
    } else {
      getProductsPaginated(MORE_PRODUCTS_LIMIT + 4, null, {})
        .then((res) => res.products.filter((p) => p.id !== product.id).slice(0, MORE_PRODUCTS_LIMIT))
        .then(setMoreProducts)
        .catch(() => setMoreProducts([]))
        .finally(() => setMoreProductsLoading(false));
    }
  }, [product?.id, product?.categoryId, product?.brandId, searchParams]);

  const categoryName = product ? categories.find((c) => c.id === product.categoryId)?.name ?? "" : "";
  const brandName = product?.brandId ? brands.find((b) => b.id === product.brandId)?.name ?? "" : "";
  const rawImages = product?.images as string[] | string | undefined;
  const imageValues: string[] = Array.isArray(rawImages)
    ? rawImages.filter((u): u is string => typeof u === "string" && u.trim() !== "")
    : typeof rawImages === "string" && rawImages.trim()
      ? [String(rawImages).trim()]
      : [];
  const images = imageValues.map(resolveProductImageSrc).filter(Boolean);
  const toDisplayUrl = (url: string) =>
    url && isProxyableImageUrl(url) ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;
  const imgSrc = toDisplayUrl(images[activeImage] ?? images[0] ?? "");

  if (loading) {
    return (
      <div className="bg-brand-gradient min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-brand-gradient min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product not found</h1>
          <Link href="/products" className="text-primary font-medium hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-gradient min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex text-slate-400 text-sm mb-8 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200"
            >
              {imgSrc && !mainImageFailed ? (
                <ImageMagnifier
                  src={imgSrc}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setMainImageFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  No image
                </div>
              )}
              {imgSrc && !mainImageFailed && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium pointer-events-none hidden sm:flex">
                  <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Hover to zoom
                </span>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === idx
                        ? "border-primary shadow-lg shadow-primary/20 scale-105 z-10"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic product gallery URL */}
                    <img
                      src={toDisplayUrl(img)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {categoryName && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider rounded-full mb-4">
                {categoryName}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-sm font-medium flex-wrap mb-6">
              {brandName && (
                <span className="text-slate-500 border-r border-slate-200 pr-4">
                  Brand: <span className="text-white uppercase tracking-wide">{brandName}</span>
                </span>
              )}
              {(product.size || product.finish) && (
                <span className="text-slate-500">
                  {[product.size, product.finish].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-slate-600 text-lg leading-relaxed mb-8">{product.description}</p>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 max-w-md">
              <p className="text-sm text-slate-500 mb-6">
                Contact us to arrange wholesale pricing for your project requirements.
              </p>
              <a
                href={`https://wa.me/9779864320452?text=I'm interested in ${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
              >
                <MessageCircle className="w-5 h-5" />
                Inquire via WhatsApp
              </a>
            </div>

            {(product.size || product.finish || product.productCode) && (
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white mb-6 flex relative">
                  <span className="relative z-10 bg-brand-gradient pr-4">Details</span>
                  <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-0" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.productCode && (
                    <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm text-slate-500 mb-1 font-medium">Code</span>
                      <span className="font-bold text-slate-900">{product.productCode}</span>
                    </div>
                  )}
                  {product.size && (
                    <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm text-slate-500 mb-1 font-medium">Size</span>
                      <span className="font-bold text-slate-900">{product.size}</span>
                    </div>
                  )}
                  {product.finish && (
                    <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm text-slate-500 mb-1 font-medium">Finish</span>
                      <span className="font-bold text-slate-900">{product.finish}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mt-12 border-t border-slate-200 pt-8">
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 rounded-full bg-slate-100 text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 rounded-full bg-slate-100 text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <section className="border-t border-slate-200 pt-16">
          <h2 className="text-2xl font-bold text-white mb-2">More products</h2>
          <p className="text-slate-400 text-sm mb-8">
            Matches your filter or same category and brand as this product.
          </p>
          {moreProductsLoading ? (
            <div className="flex items-center gap-2 text-slate-400 py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading more products...</span>
            </div>
          ) : moreProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {moreProducts.map((p) => {
                const images = Array.isArray(p.images) ? p.images : (p as { image?: string }).image ? [(p as { image?: string }).image!] : [];
                return (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name ?? "",
                      productCode: p.productCode ?? "",
                      brand: p.brandId ? brands.find((b) => b.id === p.brandId)?.name : undefined,
                      brandId: p.brandId,
                      category: p.categoryId ? categories.find((c) => c.id === p.categoryId)?.name : undefined,
                      categoryId: p.categoryId,
                      images,
                      inStock: p.status === "active",
                      status: p.status,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-8">No other products to show right now.</p>
          )}
        </section>
      </div>
    </div>
  );
}
