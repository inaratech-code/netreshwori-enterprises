/**
 * Convert a products CSV file to the JSON format expected by bulk-import-products.js.
 *
 * CSV: first row = headers (productCode, name, category, brand, size, finish, image or images).
 * Output: { "products": [ ... ] } written to stdout or a file.
 *
 * Usage:
 *   node scripts/csv-to-json.js path/to/products.csv
 *   node scripts/csv-to-json.js path/to/products.csv -o products-import.json
 *
 * Then run: npm run bulk-import -- products-import.json
 */

const fs = require("fs");
const path = require("path");

function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    while (i < len) {
      if (text[i] === '"') {
        let field = "";
        i++;
        while (i < len) {
          if (text[i] === '"') {
            i++;
            if (text[i] === '"') {
              field += '"';
              i++;
            } else break;
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
        if (text[i] === "\r") i++;
        if (text[i] === "\n") {
          i++;
          break;
        }
        if (text[i] === ",") i++;
        continue;
      }
      let field = "";
      while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
        field += text[i];
        i++;
      }
      row.push(field.trim());
      if (text[i] === "\r") i++;
      if (text[i] === "\n") {
        i++;
        break;
      }
      if (text[i] === ",") i++;
    }
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "");
  const outIdx = args.indexOf("-o");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
  const csvPath = (outIdx >= 0 ? args.filter((_, i) => i !== outIdx && i !== outIdx + 1) : args)[0];

  if (!csvPath) {
    console.error("Usage: node scripts/csv-to-json.js <file.csv> [-o output.json]");
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(resolved)) {
    console.error("File not found:", resolved);
    process.exit(1);
  }

  let text = fs.readFileSync(resolved, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = parseCSV(text);
  if (rows.length < 2) {
    console.error("CSV must have a header row and at least one data row.");
    process.exit(1);
  }

  const rawHeaders = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ""));
  const keyMap = {
    productcode: "productCode",
    name: "name",
    category: "category",
    brand: "brand",
    size: "size",
    finish: "finish",
    image: "image",
    images: "images",
    imageurl: "image",
    img: "image",
  };
  const headers = rawHeaders.map((h) => keyMap[h.toLowerCase().replace(/\s+/g, "")] || h);
  const products = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      let val = (row[c] ?? "").trim();
      if (key === "image") {
        if (val) obj[key] = val;
        continue;
      }
      if (key === "images" && typeof val === "string" && val) {
        val = val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (val !== "" && (Array.isArray(val) ? val.length > 0 : true)) obj[key] = val;
    }
    if (Object.keys(obj).length > 0) products.push(obj);
  }

  const out = JSON.stringify({ products }, null, 2);
  if (outFile) {
    fs.writeFileSync(path.resolve(process.cwd(), outFile), out, "utf8");
    console.log("Wrote", products.length, "products to", outFile);
  } else {
    console.log(out);
  }
}

main();
