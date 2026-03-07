"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Share2, Heart, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getProduct, getCategories, getBrands, getSimilarProducts } from "@/lib/admin/firestore";
import type { Product, Category, Brand } from "@/lib/admin/types";
import { resolveProductImageSrc } from "@/lib/utils";
import ProductCard from "@/components/product/ProductCard";

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [mainImageFailed, setMainImageFailed] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

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

  useEffect(() => {
    if (!product?.categoryId || !product?.id) return;
    getSimilarProducts(product.id, product.categoryId, { brandId: product.brandId ?? undefined, limit: 8 })
      .then(setSimilarProducts)
      .catch(() => setSimilarProducts([]));
  }, [product?.id, product?.categoryId, product?.brandId]);

  const categoryName = product ? categories.find((c) => c.id === product.categoryId)?.name ?? "" : "";
  const brandName = product?.brandId ? brands.find((b) => b.id === product.brandId)?.name ?? "" : "";
  const rawImages = product?.images;
  const imageValues: string[] = Array.isArray(rawImages)
    ? rawImages.filter((u): u is string => typeof u === "string" && u.trim() !== "")
    : [];
  const images = imageValues.map(resolveProductImageSrc).filter(Boolean);
  const imgSrc = images[activeImage] ?? images[0];

  if (loading) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Product not found</h1>
          <Link href="/products" className="text-primary font-medium hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex text-slate-500 text-sm mb-8 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
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
                <img
                  src={imgSrc}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={() => setMainImageFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  No image
                </div>
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
                    <img
                      src={img}
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
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-sm font-medium flex-wrap mb-6">
              {brandName && (
                <span className="text-slate-500 border-r border-slate-200 pr-4">
                  Brand: <span className="text-slate-900 uppercase tracking-wide">{brandName}</span>
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
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex relative">
                  <span className="relative z-10 bg-white pr-4">Details</span>
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

        {similarProducts.length > 0 && (
          <section className="border-t border-slate-200 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Similar products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => {
                const images = Array.isArray(p.images) ? p.images : (p as { image?: string }).image ? [(p as { image?: string }).image!] : [];
                return (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name ?? "",
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
          </section>
        )}
      </div>
    </div>
  );
}
