import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Base URL for CSV image filenames. Set in .env.local (e.g. Firebase Storage folder or your CDN). */
const PRODUCT_IMAGES_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL) || "";
/** Optional suffix (e.g. ?alt=media for Firebase Storage). Set in .env.local. */
const PRODUCT_IMAGES_BASE_URL_SUFFIX =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL_SUFFIX) || "";

/**
 * Converts a Google Drive share link to a direct image URL for <img src>.
 * Supports: drive.google.com/file/d/ID/view, drive.google.com/open?id=ID, drive.google.com/uc?id=ID
 * File must be shared so "Anyone with the link" can view.
 */
export function driveLinkToImageUrl(url: string): string {
  const trimmed = (url || "").trim();
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!fileIdMatch) return "";
  return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
}

function isDriveLink(url: string): boolean {
  return /^https?:\/\/(drive\.google\.com|www\.drive\.google\.com)\//.test(url.trim());
}

/**
 * Resolves a product image value to a URL usable in <img src>.
 * - Google Drive links → converted to direct image URL (uc?export=view&id=...).
 * - Other full URLs (http/https) → used as-is.
 * - If value is a filename and NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL is set,
 *   returns base URL + encoded filename + optional suffix (e.g. ?alt=media for Firebase Storage).
 */
export function resolveProductImageSrc(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (isDriveLink(trimmed)) return driveLinkToImageUrl(trimmed);
    return trimmed;
  }
  const base = (PRODUCT_IMAGES_BASE_URL || "").trim();
  if (!base) return "";
  const baseWithSlash = base.endsWith("/") ? base : base + "/";
  const suffix = (PRODUCT_IMAGES_BASE_URL_SUFFIX || "").trim();
  return baseWithSlash + encodeURIComponent(trimmed) + suffix;
}
