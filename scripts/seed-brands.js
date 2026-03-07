/**
 * Seed brands in Firestore from the partners list (src/data/partners.json).
 * Uses the same Firebase credentials as bulk-import (scripts/service-account.json).
 *
 * Usage: npm run seed-brands
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const partnersPath = path.join(__dirname, "..", "src", "data", "partners.json");
const partnersData = JSON.parse(fs.readFileSync(partnersPath, "utf8"));
const BRAND_NAMES = partnersData.map((p) => p.name);

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
  const existing = await db.collection("brands").get();
  const existingNames = new Set(existing.docs.map((d) => d.data().name?.toLowerCase().trim()));

  let added = 0;
  for (const name of BRAND_NAMES) {
    const n = (name || "").trim();
    if (!n) continue;
    if (existingNames.has(n.toLowerCase())) {
      console.log("  Skip (exists):", n);
      continue;
    }
    await db.collection("brands").add({
      name: n,
      logo: "",
      description: "",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    existingNames.add(n.toLowerCase());
    added++;
    console.log("  Added:", n);
  }

  console.log("\nDone. Added", added, "brand(s).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
