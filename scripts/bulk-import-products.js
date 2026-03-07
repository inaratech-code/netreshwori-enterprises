/**
 * Bulk import products from a JSON file (run from Cursor terminal or command line).
 *
 * Usage:
 *   node scripts/bulk-import-products.js [path-to-products.json]
 *
 * Default file: products-import.json in project root.
 *
 * Setup (one-time):
 *   1. In Firebase Console: Project settings → Service accounts → Generate new private key.
 *   2. Save the JSON as scripts/service-account.json (or set GOOGLE_APPLICATION_CREDENTIALS).
 *   3. Ensure scripts/service-account.json is in .gitignore (do not commit it).
 *
 * JSON format: { "products": [ { "name": "...", "category": "Category Name", "brand": "Brand Name", ... } ] }
 * See BULK_UPLOAD_GUIDE.md for full column reference.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const defaultPath = path.join(projectRoot, "products-import.json");
const jsonPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : defaultPath;

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
      "Firebase credentials not found. Either:\n" +
        "  1. Place your Firebase service account JSON at scripts/service-account.json\n" +
        "  2. Or set GOOGLE_APPLICATION_CREDENTIALS to the path of that file.\n" +
        "  Get the key from Firebase Console → Project settings → Service accounts → Generate new private key."
    );
    process.exit(1);
  }
  return admin.firestore();
}

async function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error("File not found:", jsonPath);
    console.error("Usage: node scripts/bulk-import-products.js [path-to-products.json]");
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(1);
  }

  if (!data.products || !Array.isArray(data.products)) {
    console.error("JSON must have a 'products' array. Example: { \"products\": [ { \"name\": \"...\", \"category\": \"...\" } ] }");
    process.exit(1);
  }

  const db = initFirebase();

  const [categoriesSnap, brandsSnap] = await Promise.all([
    db.collection("categories").get(),
    db.collection("brands").get(),
  ]);

  const categoryByName = new Map();
  categoriesSnap.docs.forEach((d) => categoryByName.set(d.data().name?.toLowerCase?.()?.trim() || "", d.id));
  const brandByName = new Map();
  brandsSnap.docs.forEach((d) => brandByName.set(d.data().name?.toLowerCase?.()?.trim() || "", d.id));

  let created = 0;
  let errors = [];

  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i];
    const name = (p.name || "").trim();
    if (!name) {
      errors.push(`Row ${i + 1}: "name" is required.`);
      continue;
    }

    const catName = (p.category || p.categoryId || "").trim().toLowerCase();
    const categoryId = p.categoryId || (catName ? categoryByName.get(catName) : null);
    if (!categoryId) {
      errors.push(`"${name}": category "${p.category || p.categoryId || ""}" not found. Create it in Admin → Categories first.`);
      continue;
    }

    const brandName = (p.brand || "").trim().toLowerCase();
    let brandId = p.brandId || (brandName ? brandByName.get(brandName) : null) || null;
    if (p.brand && !brandId) {
      errors.push(`"${name}": brand "${p.brand}" not found. Create it in Admin → Brands or leave brand empty.`);
      continue;
    }

    let images = [];
    if (p.image?.trim()) images = [p.image.trim()];
    else if (p.images) {
      images = Array.isArray(p.images)
        ? p.images.filter((u) => typeof u === "string" && u.trim())
        : String(p.images)
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean);
    }

    try {
      await db.collection("products").add({
        productCode: (p.productCode || "").trim() || undefined,
        name,
        brandId: brandId || undefined,
        categoryId,
        size: (p.size || "").trim() || "",
        finish: (p.finish || "").trim() || "",
        description: "",
        images,
        featured: false,
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      created++;
      if (created % 10 === 0) process.stdout.write(`  Imported ${created}...\n`);
    } catch (err) {
      errors.push(`"${name}": ${err.message}`);
    }
  }

  if (errors.length) {
    console.error("\nErrors:");
    errors.forEach((e) => console.error("  -", e));
  }
  console.log(`\nDone. Created ${created} product(s).${errors.length ? ` ${errors.length} error(s).` : ""}`);
  if (created > 0) console.log("Products are live on your website.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
