/**
 * Delete all products from Firestore (run from terminal).
 *
 * Usage:
 *   node scripts/delete-all-products.js
 *   node scripts/delete-all-products.js --confirm
 *
 * Requires the same Firebase setup as bulk-import:
 *   scripts/service-account.json (or GOOGLE_APPLICATION_CREDENTIALS)
 *
 * Without --confirm, the script only prints how many products would be deleted.
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
      "Firebase credentials not found. Place your service account JSON at scripts/service-account.json\n" +
        "  (Firebase Console → Project settings → Service accounts → Generate new private key)"
    );
    process.exit(1);
  }
  return admin.firestore();
}

async function main() {
  const confirm = process.argv.includes("--confirm");
  const db = initFirebase();
  const col = db.collection("products");

  const snap = await col.get();
  const count = snap.size;

  if (count === 0) {
    console.log("No products in the database.");
    return;
  }

  if (!confirm) {
    console.log(`Found ${count} product(s). To delete them all, run:\n  node scripts/delete-all-products.js --confirm\n`);
    return;
  }

  const BATCH_SIZE = 500;
  const batches = [];
  let current = db.batch();
  let opCount = 0;

  snap.docs.forEach((d) => {
    current.delete(d.ref);
    opCount++;
    if (opCount === BATCH_SIZE) {
      batches.push(current);
      current = db.batch();
      opCount = 0;
    }
  });
  if (opCount > 0) batches.push(current);

  for (const b of batches) {
    await b.commit();
  }

  console.log(`Deleted ${snap.size} product(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
