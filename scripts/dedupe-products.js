/**
 * Delete duplicate products in Firestore.
 * Duplicates only when ALL fields match: productCode, name, category, brand, size, finish, image(s).
 * Keeps one document per group (oldest by createdAt) and deletes the rest.
 *
 * Usage: node scripts/dedupe-products.js
 *
 * Setup: same as bulk-import — scripts/service-account.json or GOOGLE_APPLICATION_CREDENTIALS.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

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
      "Firebase credentials not found. Place scripts/service-account.json or set GOOGLE_APPLICATION_CREDENTIALS."
    );
    process.exit(1);
  }
  return admin.firestore();
}

/** Build a key from all headings: productCode, name, categoryId, brandId, size, finish, image(s). */
function keyFor(product) {
  const code = (product.productCode || "").trim().toLowerCase();
  const name = (product.name || "").trim().toLowerCase();
  const cat = (product.categoryId || "").trim();
  const brand = (product.brandId || "").trim();
  const size = (product.size || "").trim().toLowerCase();
  const finish = (product.finish || "").trim().toLowerCase();
  const images = Array.isArray(product.images) ? product.images.map((u) => String(u).trim()).filter(Boolean) : [];
  const imageKey = [...images].sort().join("|");
  return [code, name, cat, brand, size, finish, imageKey].join("\t");
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection("products").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const groups = new Map();
  for (const p of docs) {
    const k = keyFor(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }

  const toDelete = [];
  for (const [, list] of groups) {
    if (list.length <= 1) continue;
    const sorted = [...list].sort((a, b) => {
      const aT = (a.createdAt && a.createdAt.toMillis) ? a.createdAt.toMillis() : (a.createdAt || 0);
      const bT = (b.createdAt && b.createdAt.toMillis) ? b.createdAt.toMillis() : (b.createdAt || 0);
      return aT - bT;
    });
    const keep = sorted[0];
    for (let i = 1; i < sorted.length; i++) toDelete.push(sorted[i]);
  }

  if (toDelete.length === 0) {
    console.log("No duplicate products found.");
    return;
  }

  console.log(`Found ${toDelete.length} duplicate(s). Keeping oldest of each group, deleting the rest...`);
  const batchSize = 500;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = db.batch();
    const chunk = toDelete.slice(i, i + batchSize);
    for (const p of chunk) {
      batch.delete(db.collection("products").doc(p.id));
    }
    await batch.commit();
    console.log(`  Deleted ${Math.min(i + batchSize, toDelete.length)} / ${toDelete.length}`);
  }
  console.log(`Done. Removed ${toDelete.length} duplicate product(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
