/**
 * Seed categories in Firestore (one-time).
 * Uses the same Firebase credentials as bulk-import (scripts/service-account.json).
 *
 * Usage: node scripts/seed-categories.js
 * Or:    npm run seed-categories
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const CATEGORY_NAMES = [
  "cement",
  "CPVC/PVC",
  "sanitory",
  "Granite/marbel",
  "Bathroom Fittings",
  "Wall/floor tiles, glossy",
  "floor, glossy",
  "floor, glossy/matt",
  "wall/floor",
  "wall, alivation",
  "floor, parking tile",
  "floor",
  "Wall & Floor",
  "Tile",
  "Bath ware",
  "Sanitary",
  "Faucets",
  "Ceramic",
];

function initFirebase() {
  if (admin.apps.length > 0) return admin.firestore();
  const keyPath = path.join(__dirname, "service-account.json");
  if (fs.existsSync(keyPath)) {
    const key = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(key) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.error(
      "Firebase credentials not found. Place scripts/service-account.json (same as for bulk-import) or set GOOGLE_APPLICATION_CREDENTIALS."
    );
    process.exit(1);
  }
  return admin.firestore();
}

async function main() {
  const db = initFirebase();
  const existing = await db.collection("categories").get();
  const existingNames = new Set(existing.docs.map((d) => d.data().name?.toLowerCase().trim()));

  let added = 0;
  for (const name of CATEGORY_NAMES) {
    const n = (name || "").trim();
    if (!n) continue;
    if (existingNames.has(n.toLowerCase())) {
      console.log("  Skip (exists):", n);
      continue;
    }
    await db.collection("categories").add({
      name: n,
      description: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    existingNames.add(n.toLowerCase());
    added++;
    console.log("  Added:", n);
  }

  console.log("\nDone. Added", added, "category(ies).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
