import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

/** Sanitize a filename for Firebase Storage to avoid "Invalid HTTP method/URL pair" (no slashes or path segments). */
export function sanitizeStorageFileName(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "").trim() || "file";
  return base.replace(/[#\[\]?*]/g, "_").slice(0, 200);
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytesResumable(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export function productImagePath(filename: string): string {
  return `products/${Date.now()}_${sanitizeStorageFileName(filename)}`;
}

export function brandLogoPath(filename: string): string {
  return `brands/${Date.now()}_${sanitizeStorageFileName(filename)}`;
}

export function mediaPath(filename: string): string {
  return `media/${Date.now()}_${sanitizeStorageFileName(filename)}`;
}
