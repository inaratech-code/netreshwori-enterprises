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

/** Dropbox share link → direct image URL (?raw=1). */
function toDirectDropboxUrl(url: string): string {
  const u = url.trim();
  if (!/dropbox\.com\//.test(u)) return u;
  try {
    const parsed = new URL(u.startsWith("http") ? u : "https://" + u);
    parsed.searchParams.set("raw", "1");
    return parsed.toString();
  } catch {
    return u;
  }
}

/** If value looks like a URL without protocol, prepend https://. */
function normalizeToFullUrl(value: string): string {
  const s = value.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return "https:" + s;
  const looksLikeHost = /^www\./i.test(s) || (s.includes("/") && /^[^/]*\.[^/]+/.test(s) && !/\s/.test(s));
  if (looksLikeHost) return "https://" + s.replace(/^\/+/, "");
  return s;
}

/**
 * Resolves a product image value to a URL usable in <img src>.
 * - Any URL-like string is accepted (with or without https://; www. and domain/path normalized).
 * - Google Drive share links → converted to direct image URL.
 * - Dropbox share links → converted to direct image (?raw=1).
 * - Other full URLs → used as-is.
 * - If value is a filename (no URL shape) and NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL is set,
 *   returns base URL + encoded filename + optional suffix.
 */
export function resolveProductImageSrc(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = normalizeToFullUrl(trimmed);
  const isFullUrl = withProtocol.startsWith("http://") || withProtocol.startsWith("https://");

  if (isFullUrl) {
    if (isDriveLink(withProtocol)) return driveLinkToImageUrl(withProtocol);
    if (/dropbox\.com\//.test(withProtocol)) return toDirectDropboxUrl(withProtocol);
    return withProtocol;
  }

  const base = (PRODUCT_IMAGES_BASE_URL || "").trim();
  if (!base) return "";
  const baseWithSlash = base.endsWith("/") ? base : base + "/";
  const suffix = (PRODUCT_IMAGES_BASE_URL_SUFFIX || "").trim();
  return baseWithSlash + encodeURIComponent(trimmed) + suffix;
}
