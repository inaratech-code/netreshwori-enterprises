"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MessageCircle } from "lucide-react";
import { cn, resolveProductImageSrc, isProxyableImageUrl } from "@/lib/utils";

const WHATSAPP_NUMBER = "9779858421562";

function buildWhatsAppMessage(name: string, brand: string | undefined, code: string): string {
  const lines = [
    "Hi, I'm interested in this product:",
    `Name: ${name}`,
    brand ? `Brand: ${brand}` : null,
    code ? `Code: ${code}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

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
  productCode?: string;
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
  /** When set (e.g. from listing filters), product detail page will show more products matching these. */
  queryParams?: { category?: string; brand?: string };
}

function ProductCardInner({ product, priority = false, queryParams }: ProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const rawImg = getFirstImageValue(product.images);
  const resolved = resolveProductImageSrc(rawImg);
  const imgSrc = resolved && isProxyableImageUrl(resolved)
    ? `/api/image-proxy?url=${encodeURIComponent(resolved)}`
    : resolved;
  const showImg = imgSrc && !imgFailed;
  const search = new URLSearchParams();
  if (queryParams?.category) search.set("category", queryParams.category);
  if (queryParams?.brand) search.set("brand", queryParams.brand);
  const productHref = `/products/${product.id}${search.toString() ? `?${search.toString()}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "product-card-item group bg-card rounded-2xl border border-border overflow-hidden hover-lift flex flex-col h-full",
        "transition-shadow duration-300 ease-out"
      )}
    >
      <Link
        href={productHref}
        className="block relative aspect-square overflow-hidden bg-muted"
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- product image, dynamic URL
          <img
            src={imgSrc}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
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
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col gap-2">
            <span className="bg-card/90 backdrop-blur-sm text-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border border-border">
              {product.category}
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 sm:p-6 flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2 gap-2 min-w-0">
          <Link href={productHref} className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
              {product.name}
            </h3>
          </Link>
          {typeof product.rating === "number" && (
            <div className="flex items-center gap-1 shrink-0 text-amber-400">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="text-muted-foreground text-xs sm:text-sm space-y-0.5 sm:space-y-1 mb-3 sm:mb-4 min-w-0">
          {product.brand && <p className="line-clamp-2 break-words"><span className="font-medium text-foreground/80">Brand:</span> {product.brand}</p>}
          {(product.productCode ?? "").trim() && <p className="line-clamp-1 break-words"><span className="font-medium text-foreground/80">Code:</span> {product.productCode}</p>}
        </div>

        <div className="mt-auto pt-3 sm:pt-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(product.name, product.brand, product.productCode ?? ""))}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-semibold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            WhatsApp
          </a>
          <Link
            href={productHref}
            className="inline-flex items-center justify-center text-primary text-xs sm:text-sm font-bold hover:underline underline-offset-4 transition-colors py-2 sm:py-2.5"
          >
            View Details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProductCardInner);
