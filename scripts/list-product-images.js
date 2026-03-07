/**
 * List image filenames expected by products (for putting in public/product-images/).
 *
 * Usage: node scripts/list-product-images.js
 *
 * Setup: Same as bulk-import (scripts/service-account.json or GOOGLE_APPLICATION_CREDENTIALS).
 *
 * Outputs one filename per line (only filenames, not full URLs) so you know which files to add.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function initFirebase() {
  if (admin.apps.length > 0) return admin.firestore();
  const keyPath = path.join(__dirname, "service-account.json");
  if (fs.existsSync(keyPath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.error("Firebase credentials not found. Put scripts/service-account.json or set GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
  }
  return admin.firestore();
}

function isUrl(s) {
  return typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"));
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection("products").get();
  const filenames = new Set();
  let urlCount = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    const images = data.images;
    if (!images) return;
    const list = Array.isArray(images) ? images : [images];
    list.forEach((v) => {
      if (typeof v !== "string" || !v.trim()) return;
      const trimmed = v.trim();
      if (isUrl(trimmed)) {
        urlCount++;
        return;
      }
      filenames.add(trimmed);
    });
  });

  const arr = [...filenames].sort();
  if (arr.length === 0 && urlCount === 0) {
    console.log("No product images found in Firestore. Add an 'image' or 'images' column and re-import.");
    return;
  }
  if (arr.length === 0) {
    console.log("All product images are full URLs (no filenames). Nothing to add to public/product-images/.");
    return;
  }
  console.log("Add these files to public/product-images/ (names must match exactly):\n");
  arr.forEach((name) => console.log(name));
  console.log("\nTotal filenames: " + arr.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
