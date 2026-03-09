/**
 * Parse CSV text into rows (handles quoted fields with commas/newlines).
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
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

/** Maps CSV header (lowercase, no spaces) to product field. "name" = product name from CSV (not brand). */
const CSV_HEADER_KEY_MAP: Record<string, string> = {
  productcode: "productCode",
  "product_code": "productCode",
  name: "name",
  productname: "name",
  "product_name": "name",
  category: "category",
  brand: "brand",
  size: "size",
  finish: "finish",
  image: "image",
  imageurl: "image",
  image_url: "image",
  imagelink: "image",
  image_link: "image",
  img: "image",
  photo: "image",
  picture: "image",
  pictureurl: "image",
  picture_url: "image",
  images: "images",
};

/** Headers containing these (but not "images") map to "image" so any "Image" / "Image URL" / "Photo" column works. */
function mapHeaderToImage(rawHeader: string): string | null {
  const n = rawHeader.toLowerCase().replace(/\s+/g, "");
  if (n === "images") return "images";
  if (n.includes("image") || n === "img" || n.includes("photo") || n.includes("picture")) return "image";
  return null;
}

export interface CsvProductRow {
  productCode?: string;
  name?: string;
  category?: string;
  brand?: string;
  size?: string;
  finish?: string;
  image?: string;
  images?: string | string[];
}

/**
 * Parse CSV text into { products: [...] } for bulk import.
 * First row = headers (productCode, name, category, brand, size, finish, image or images).
 */
export function parseCsvToProducts(csvText: string): { products: CsvProductRow[] } {
  const text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  const rows = parseCSV(text);
  if (rows.length < 2) return { products: [] };

  const rawHeaders = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ""));
  const headers = rawHeaders.map((h) => {
    const key = h.toLowerCase().replace(/\s+/g, "");
    const mapped = CSV_HEADER_KEY_MAP[key] ?? mapHeaderToImage(h) ?? null;
    return mapped || h;
  });
  const products: CsvProductRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const val: string | string[] = (row[c] ?? "").trim();
      if (key === "image" && typeof val === "string" && val) {
        obj["image"] = val.replace(/\s+/g, " ").trim();
        continue;
      }
      if (key === "images" && typeof val === "string" && val) {
        const urls = val.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
        if (urls.length > 0) obj["images"] = urls.length === 1 ? urls[0] : urls;
        continue;
      }
      if (val !== "" && (Array.isArray(val) ? val.length > 0 : true)) obj[key] = val;
    }
    if (Object.keys(obj).length > 0) products.push(obj as CsvProductRow);
  }
  return { products };
}
