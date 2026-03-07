"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn, resolveProductImageSrc } from "@/lib/utils";

function getFirstImageValue(images: string[] | string | undefined): string {
  if (!images) return "";
  if (Array.isArray(images)) {
    const first = images[0];
    return typeof first === "string" ? first.trim() : "";
  }
  return typeof images === "string" ? images.trim() : "";
}

export interface ProductCardProduct {
  id: string;
  name: string;
  brand?: string;
  brandId?: string;
  category?: string;
  categoryId?: string;
  price?: number | null;
  images: string[];
  rating?: number;
  inStock?: boolean;
  status?: string;
}

interface ProductCardProps {
  product: ProductCardProduct;
  priority?: boolean;
}

function ProductCardInner({ product, priority = false }: ProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const rawImg = getFirstImageValue(product.images);
  const imgSrc = resolveProductImageSrc(rawImg);
  const showImg = imgSrc && !imgFailed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "product-card-item group bg-card rounded-2xl border border-border overflow-hidden hover-lift flex flex-col h-full",
        "transition-shadow duration-200"
      )}
    >
      <Link
        href={`/products/${product.id}`}
        className="block relative aspect-square overflow-hidden bg-muted"
      >
        {showImg ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-3 text-center bg-muted/50">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">No image</span>
            {rawImg && imgFailed && (
              <span className="text-[10px] mt-1 opacity-80 max-w-full truncate" title={imgSrc}>
                Image failed to load
              </span>
            )}
          </div>
        )}
        {product.category && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-border">
              {product.category}
            </span>
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          {typeof product.rating === "number" && (
            <div className="flex items-center gap-1 shrink-0 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="text-sm font-medium text-muted-foreground">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {(product.brand || product.category) && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-1">
            {[product.brand, product.category].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-border">
          <Link
            href={`/products/${product.id}`}
            className="text-primary text-sm font-bold hover:underline underline-offset-4 transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProductCardInner);
