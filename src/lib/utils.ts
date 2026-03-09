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

/** If value looks like a URL without protocol, prepend https:// and normalize. */
function normalizeToFullUrl(value: string): string {
  const s = value.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return "https:" + s;
  if (/^www\./i.test(s)) return "https://" + s.replace(/^\/+/, "");
  if (s.includes("/") && /^[^/]*\.[^/]+/.test(s)) return "https://" + s.replace(/^\/+/, "").replace(/\s/g, "%20");
  if (s.includes("/") && s.includes(".")) return "https://" + s.replace(/^\/+/, "").replace(/\s/g, "%20");
  return s;
}

/**
 * Firebase Storage returns 400 "Invalid HTTP method/URL pair" when the object path in the URL
 * contains unencoded slashes. Download URL must be: .../o/PATH_ENCODED?alt=media (e.g. products%2Fimg.jpg).
 */
function normalizeFirebaseStorageDownloadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("firebasestorage.googleapis.com") || !parsed.pathname.startsWith("/v0/b/"))
      return url;
    const match = parsed.pathname.match(/^(\/v0\/b\/[^/]+\/o\/)(.+)$/);
    if (!match) return url;
    const prefix = match[1];
    const pathSegment = match[2];
    try {
      const decoded = decodeURIComponent(pathSegment);
      const encoded = decoded.split("/").map(segment => encodeURIComponent(segment)).join("%2F");
      const path = prefix + encoded;
      return `${parsed.origin}${path}?alt=media`;
    } catch {
      return url;
    }
  } catch {
    return url;
  }
}

/**
 * Resolves a product image value to a URL usable in <img src>.
 * Accepts any format or URL:
 * - data: and blob: URLs → used as-is.
 * - Full URLs (http/https) or URL without protocol (https:// added), including with spaces (encoded as %20).
 * - Google Drive share links → converted to direct image URL.
 * - Dropbox share links → converted to direct image (?raw=1).
 * - Firebase Storage URLs → path normalized so GET works (avoids 400).
 * - Other URLs (OneDrive, SharePoint, CDNs, etc.) → used as-is (with https if missing).
 * - Filename only (e.g. "photo.jpg") when NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL is set → base + encoded filename + suffix.
 */
export function resolveProductImageSrc(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  const withProtocol = normalizeToFullUrl(trimmed);
  const isFullUrl = withProtocol.startsWith("http://") || withProtocol.startsWith("https://");

  if (isFullUrl) {
    if (isDriveLink(withProtocol)) return driveLinkToImageUrl(withProtocol);
    if (/dropbox\.com\//.test(withProtocol)) return toDirectDropboxUrl(withProtocol);
    if (withProtocol.includes("firebasestorage.googleapis.com")) return normalizeFirebaseStorageDownloadUrl(withProtocol);
    return withProtocol;
  }

  const base = (PRODUCT_IMAGES_BASE_URL || "").trim();
  if (!base) return "";
  const baseWithSlash = base.endsWith("/") ? base : base + "/";
  const suffix = (PRODUCT_IMAGES_BASE_URL_SUFFIX || "").trim();
  const built = baseWithSlash + encodeURIComponent(trimmed) + suffix;
  if (built.includes("firebasestorage.googleapis.com")) return normalizeFirebaseStorageDownloadUrl(built);
  return built;
}
