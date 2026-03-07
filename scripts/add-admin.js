/**
 * Add an admin so Firestore rules allow writes (bulk import, categories, brands, products).
 * Uses scripts/service-account.json (same as bulk-import).
 *
 * Usage:
 *   node scripts/add-admin.js <email>
 *   node scripts/add-admin.js <uid>
 *
 * Example: node scripts/add-admin.js you@example.com
 *
 * Then deploy rules if needed: firebase deploy --only firestore:rules
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function initFirebase() {
  if (admin.apps.length > 0) return admin.app();
  const keyPath = path.join(__dirname, "service-account.json");
  if (fs.existsSync(keyPath)) {
    const key = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(key) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.error("Firebase credentials not found. Place scripts/service-account.json");
    process.exit(1);
  }
  return admin.app();
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node scripts/add-admin.js <email-or-uid>");
    process.exit(1);
  }

  initFirebase();
  const auth = admin.auth();
  const db = admin.firestore();

  let uid = input;
  if (input.includes("@")) {
    try {
      const user = await auth.getUserByEmail(input);
      uid = user.uid;
      console.log("Found user:", user.email, "UID:", uid);
    } catch (e) {
      console.error("No user with email:", input);
      process.exit(1);
    }
  }

  await db.collection("admins").doc(uid).set({ addedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log("Admin added for UID:", uid);
  console.log("You can now use bulk import and other admin writes.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
