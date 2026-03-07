# Bulk Product Upload: Excel → Admin → Website

This guide shows how to convert an Excel sheet into products and publish them on your website using the admin panel.

---

## Quick flow: Excel → Website (4 steps)

| Step | What to do |
|------|-------------|
| **1** | In Excel: create a sheet with columns **productCode**, **name**, **category**, **brand**, **size**, **finish**, **image** (see table below). One row = one product. |
| **2** | Save as **CSV** (File → Save As → CSV). |
| **3** | Convert CSV to JSON: run `npm run csv-to-json -- path/to/products.csv -o products-import.json` in the project, or use [convertcsv.com/csv-to-json](https://www.convertcsv.com/csv-to-json.htm) / [csvjson.com/csv2json](https://csvjson.com/csv2json) and wrap the array as `{ "products": [ ... ] }`. |
| **4** | In the website: log in → **Admin → Products → Bulk Import** → choose your JSON file (or paste JSON) → click **Import**. Products appear on the site right away. |

**Before you start:** Create your **Categories** and **Brands** in Admin (Categories / Brands pages) so the names in your Excel match (e.g. category "Ceramic Tiles", brand "Kajaria").

---

## How product images work

| Source | How |
|--------|-----|
| **CSV with full URLs** | In the **image** column put a **full URL** (e.g. `https://example.com/photo.jpg` or a Firebase Storage URL). Re-import the CSV so products get those URLs. |
| **Google Drive image links** | You can put **Google Drive file links** in the **image** column or in Add URL. The site converts them to direct image URLs. Share each file so “Anyone with the link” can view. |
| **CSV with filenames only** | If your CSV has **filenames** (e.g. `5503.jpg`, `tango black.png`, `P. White.jpg`), host those image files at a single base URL (e.g. Firebase Storage folder, your server, or a CDN). Then in **`.env.local`** add: `NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL=https://your-base-url.com/images/` (trailing slash optional). The site will load each image as `base URL + filename`, so names in the CSV must match the file names exactly. |
| **Admin → Add/Edit product** | Use **Add URL** to paste one or more image URLs (one per line or comma-separated); all are added. **Upload** is optional and requires Firebase Storage. |
| **Bulk import: multiple images** | In CSV or Sheet use an **images** column with URLs separated by commas (e.g. `https://a.jpg, https://b.jpg`). Or use **image** for a single URL. |
| **Bulk import modal** | Use the **image** (single) or **images** (comma-separated URLs) column in your CSV with full URLs (no Storage needed). Optionally attach image files in the modal if you use Firebase Storage. |

---

## Import from Google Sheet

You can use a **Google Sheet** as your product list instead of uploading a CSV file.

1. **Create a sheet** with the same columns as the CSV: **productCode**, **name**, **category**, **brand**, **size**, **finish**, **image** (use full URLs or Google Drive links for images).
2. **Publish to web:** In Google Sheets, go to **File → Share → Publish to web**. Open the **Link** tab, choose **Comma-separated values (.csv)** and click **Publish**. Copy the link (it looks like `https://docs.google.com/spreadsheets/d/.../pub?output=csv`).
3. **In the website:** **Admin → Products → Bulk Import** → paste the link in **Import from Google Sheet** → click **Fetch from Sheet**. The products will load into the box. Click **Import** to save them.

You can edit the sheet anytime and fetch again to update the list before importing.

---

## Bulk image upload (Admin)

Use this when you have a **CSV/JSON with product rows but no image URLs**, and a **folder of image files** you want to assign one‑to‑one to those products.

1. **Prepare the CSV or JSON**
   - Include columns: **name**, **category** (and optionally productCode, brand, size, finish).
   - **Leave the image column empty** (or omit it) so the importer uses the files you attach instead.

2. **Put your image files in the same order as the product rows**
   - Example: row 1 = Product A → first image file = photo for Product A; row 2 = Product B → second image file = photo for Product B, etc.
   - File names don’t need to match product names; **order** is what matters.

3. **In the website**
   - Log in → **Admin → Products** → click **Bulk Import**.
   - **Choose CSV or JSON file** (your product list).
   - In **Images (optional, assigned in order)** click **Choose files** and select all image files **in the same order as your products** (e.g. select `img1.jpg`, then `img2.jpg`, …).
   - Click **Import**.

4. **What happens**
   - The image files are uploaded to Firebase Storage.
   - The first product in the file gets the first image, the second product gets the second image, and so on. If you have more products than images, later products get no image; if you have more images than products, the extra images are unused.

**If your CSV already has an image column** (full URLs or filenames), you don’t need to attach image files — the importer uses the URLs/filenames from the file. Attach files only when the CSV has **no** image data and you want to assign one image per product in order.

**If you see "No image":** The product has no valid image (no URL in Firestore, or base URL not set when using filenames in CSV). Add an image via Admin (Upload or Add URL), or put full URLs in the CSV and re-import, or set `NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL` and use filenames in the CSV.

**Don’t want to use Firebase Storage?** You can use **Add URL** (paste image links) in Add/Edit Product, and put **full image URLs** in the CSV **image** column for bulk import. No Storage setup needed.

**Image upload (file) not working?** The **Upload** button requires Firebase Storage to be set up and deployed. If you prefer not to use Storage, use **Add URL** or CSV with image URLs instead.

---

## Fix console errors (Firebase index & 404s)

**“The query requires an index” (Firebase)**  
1. Deploy indexes: in the project folder run  
   `firebase deploy --only firestore:indexes`  
2. Or click the link in the browser console error to create the index in Firebase Console, then deploy again.  
3. Wait a few minutes for indexes to build. The products page will then load without that error (until then it uses a simple fallback query).

**Partner logo 404 (e.g. `/partners/Acquario.png`)**  
Partner logos are served from **`public/partners/`**. Add the missing file with the exact name (e.g. `Acquario.png`) in that folder. Names come from **`src/data/partners.json`** (`logoFile` for each partner). If a logo is missing, the site shows the partner’s first letter instead.

---

## CSV to JSON (command line)

From the project folder you can convert a CSV file to the exact JSON format for bulk import:

```bash
# Output to a file (then run bulk import)
npm run csv-to-json -- path/to/products.csv -o products-import.json
npm run bulk-import -- products-import.json

# Or print JSON to stdout
npm run csv-to-json -- path/to/products.csv
```

The CSV **first row must be headers**: `productCode`, `name`, `category`, `brand`, `size`, `finish`, `image` (or `images` for multiple URLs separated by commas). Headers are case-insensitive and spaces are ignored (e.g. "product code" works).

**If your file is `src/data/products.csv`** (all product details in one CSV), from the project root run:
```bash
npm run import-products
```
This converts the CSV to JSON and runs the bulk import in one step. Ensure `scripts/service-account.json` exists (see “Upload from Cursor” below).

---

## Before or after deployment?

| Method | Before deployment | After deployment |
|--------|-------------------|------------------|
| **Admin panel** (browser) | Yes — run `npm run dev`, open the site, log in, then **Admin → Products → Bulk Import**. Data is saved to Firebase and will appear on the live site once you deploy. | Yes — open your live site, log in as admin, then **Admin → Products → Bulk Import**. |
| **Cursor / terminal** (`npm run bulk-import`) | Yes — run the script on your machine anytime. It writes to Firebase directly, so products are there before or after you deploy. | Yes — run the script anytime to add more products. No need to open the browser or have the site running. |

So you can **seed products before going live** (e.g. run `npm run bulk-import` or use the admin panel on localhost), or **add products after deployment** the same way.

---

## Upload from Cursor (or terminal)

You can run the bulk import **from Cursor** (or any terminal) so the JSON file in your project is imported without opening the browser.

### One-time setup

1. **Firebase service account key**
   - In **Firebase Console** → your project → **Project settings** (gear) → **Service accounts**.
   - Click **Generate new private key** and download the JSON file.
   - Save it in your project as **`scripts/service-account.json`** (this path is in `.gitignore` — do not commit it).

2. **Install dependencies** (if you haven’t):
   ```bash
   npm install
   ```

### Run the import

1. Put your products JSON in the project, e.g. **`products-import.json`** in the project root (same format as in Step 3: `{ "products": [ ... ] }`).
2. In **Cursor**, open the terminal (`` Ctrl+` `` or **Terminal → New Terminal**) and run:
   ```bash
   npm run bulk-import
   ```
   That uses `products-import.json` in the project root.

   Or pass the file path:
   ```bash
   npm run bulk-import -- path/to/my-products.json
   ```

3. The script reads categories and brands from Firestore, then creates each product. When it finishes, products are live on the website.

**Troubleshooting**

- **"Firebase credentials not found"** — Add `scripts/service-account.json` as in setup step 1, or set `GOOGLE_APPLICATION_CREDENTIALS` to the path of that file.
- **"Missing or insufficient permissions"** (browser bulk import) — Firestore rules allow writes only for users in the `admins` collection. Run: `npm run add-admin -- your@email.com` (use the same email you use to log in to the admin panel). Then try the import again.
- **Image uploads fail or "Upload denied"** — Storage uses the same admin check. Ensure your account is in the Admins list: `npm run add-admin -- your@email.com`. Then log in again and try uploading images in Admin → Products (Add/Edit product or Bulk Import).
- **"category ... not found"** — Categories are now created automatically during import; if you still see this, check the category name spelling.
- **"brand ... not found"** — Brands from your partners list are created automatically; other brands must exist in Admin → Brands or be in the partners list.

---

## Step 1: Create your Excel sheet

Create a spreadsheet with **one row per product**. Use exactly these column headers in the **first row**:

| productCode | name | category | brand | size | finish | image |
|-------------|------|----------|-------|------|--------|-------|
| KAJ-001 | Calacatta Marble Tile | Ceramic Tiles | Kajaria | 60x60 cm | Polished | https://example.com/tile1.jpg |
| KAJ-002 | White Ceramic Tile | Ceramic Tiles | Kajaria | 30x30 cm | Matt | https://example.com/tile2.jpg |

For **multiple images per product**, use an **images** column with URLs separated by commas (e.g. `https://a.jpg, https://b.jpg`). When converting to JSON, that becomes an array or a comma-separated string; the importer accepts both.

### Column rules

| Column | Required | Description |
|--------|----------|-------------|
| **productCode** | No | Your internal code (e.g. KAJ-001). Leave empty if you don’t use codes. |
| **name** | **Yes** | Product name. |
| **category** | **Yes** | Category **name** (must match a category in Admin → Categories, e.g. "Ceramic Tiles"). |
| **brand** | No | Brand **name** (must match a brand in Admin → Brands, e.g. "Kajaria"). Leave empty for no brand. |
| **size** | No | e.g. 60x60 cm, 30x30 cm. |
| **finish** | No | e.g. Polished, Matt, Glossy. |
| **image** | No | One image URL for this product. |
| **images** | No | Multiple image URLs: use comma-separated in Excel (e.g. `https://a.jpg, https://b.jpg`). In JSON you can use `"images": ["url1", "url2"]` or `"images": "url1, url2"`. |

- Category and brand are matched by **name** (case-insensitive). Create the categories and brands in the admin panel first so the names match.
- **Images**: use **image** (one URL) or **images** (multiple URLs). Image URLs must be publicly accessible (e.g. from your Media Library or Firebase Storage). Alternatively, skip image/images and use the **Images (optional)** file upload in the Bulk Import modal; files are assigned in order (set **imageCount** per product in JSON if needed).
- Avoid commas inside cells if you save as CSV, or wrap those cells in double quotes.

### How to add images in the Excel sheet (use links)

**Yes — use links (URLs).** The bulk import does not accept image files directly in the sheet. You put the **full image URL** in the **image** or **images** column.

**Option 1: Get URLs from your admin panel (recommended)**  
1. Go to **Admin → Media Library**.  
2. Upload your product images.  
3. For each image, click **Copy URL** (or copy the URL shown).  
4. In your Excel sheet, paste that URL into the **image** column for the matching product.  
   - One product, one image: use the **image** column, one URL per row.  
   - One product, many images: use the **images** column and put multiple URLs in one cell, separated by commas (e.g. `https://..., https://...`).

**Option 2: Skip URLs in the sheet and use file upload**  
- Leave the **image** and **images** columns empty in your Excel/JSON.  
- In **Admin → Products → Bulk Import**, use **Images (optional)** to select image files.  
- Images are assigned to products in **row order** (first product gets the first image(s), etc.). You can set **imageCount** in the JSON (e.g. `1` or `2`) so each product gets the right number of images.

**Important:** The **image** column must contain **full URLs** (e.g. `https://...`). Filenames alone are not used; use Admin → Edit product → **Upload** or **Add URL** for each product if you don’t have URLs in the sheet.

**Re-importing to add images:** If you already imported products without images, re-import the same CSV with the **image** column filled. The importer will **update** existing products when it can match by **productCode** (e.g. your company codes) or by **name + category**, so images are added without creating duplicates. You don’t need to change product codes.

**Example in Excel:**  
| image |  
|-------|  
| https://firebasestorage.googleapis.com/v0/b/your-bucket/o/media%2F123_image.jpg?alt=media |  
| https://firebasestorage.googleapis.com/v0/b/your-bucket/o/media%2F456_photo.jpg?alt=media |

The link must be **publicly accessible** (anyone with the link can view the image). Media Library and Firebase Storage URLs are fine.

---

## Step 2: Save Excel as CSV

1. In Excel: **File → Save As**.
2. Choose **CSV (Comma delimited) (*.csv)**.
3. Save the file (e.g. `products.csv`).

---

## Step 3: Convert CSV to JSON

You need a JSON file in this shape:

```json
{
  "products": [
    {
      "productCode": "KAJ-001",
      "name": "Calacatta Marble Tile",
      "category": "Ceramic Tiles",
      "brand": "Kajaria",
      "size": "60x60 cm",
      "finish": "Polished",
      "image": "https://example.com/tile1.jpg"
    },
    {
      "productCode": "KAJ-002",
      "name": "White Ceramic Tile",
      "category": "Ceramic Tiles",
      "brand": "Kajaria",
      "size": "30x30 cm",
      "finish": "Matt",
      "images": ["https://example.com/tile2a.jpg", "https://example.com/tile2b.jpg"]
    }
  ]
}
```

### Option A: Use an online CSV to JSON converter

1. Go to **https://www.convertcsv.com/csv-to-json.htm** or **https://csvjson.com/csv2json**.
2. Upload your `products.csv` (or paste its content).
3. Convert to JSON. You’ll get an array like `[{ ... }, { ... }]`.
4. Wrap it: change the result to `{ "products": [ ...paste array here... ] }`.
5. Save as `products-import.json` (UTF-8).

### Option B: Use the downloadable template (no Excel)

1. In **Admin → Products → Bulk Import**, click **Download template**.
2. Open the JSON file and edit the sample products: set **name**, **category** (exact category name), **brand** (exact brand name or leave empty), **productCode**, **size**, **finish**.
3. Save and use **Choose JSON file** in the Bulk Import modal to upload.

---

## Step 4: Import in the admin panel and publish

1. Log in to your site and go to **Admin → Products**.
2. Click **Bulk Import**.
3. **Choose JSON file** and select your `products-import.json`, or paste the JSON into the text area.
4. **Images:** Either put **image** or **images** (URLs) in your JSON, or leave them out and use **Images (optional)** to upload image files; those are assigned to products in row order (use **imageCount** in JSON per product if needed).
5. Click **Import**. Products are created and **published on the website immediately** (they appear on the public Products page).
6. If you see "category not found" or "brand not found", add that category or brand in **Admin → Categories** or **Admin → Brands** first, then fix the names in your JSON to match and import again.

---

## Quick reference: JSON fields for bulk upload

| Field | Required | Example |
|-------|----------|---------|
| **productCode** | No | `"KAJ-001"` |
| **name** | **Yes** | `"Calacatta Marble Tile"` |
| **category** | **Yes** | `"Ceramic Tiles"` (must match a category name in admin) |
| **brand** | No | `"Kajaria"` (must match a brand name in admin) or omit |
| **size** | No | `"60x60 cm"` |
| **finish** | No | `"Polished"` |
| **image** | No | One image URL: `"https://example.com/photo.jpg"` |
| **images** | No | Multiple URLs: `["url1", "url2"]` or `"url1, url2"` |

Imported products get **description** empty, **featured** false, and **status** active. You can edit those in the admin after import.

---

## Troubleshooting

- **"category ... not found"** – The **category** value must match exactly (case-insensitive) a category name in Admin → Categories. Create the category first if needed.
- **"brand ... not found"** – The **brand** value must match a brand name in Admin → Brands, or leave **brand** empty.
- **Invalid JSON** – Check for missing commas, trailing commas, or unescaped quotes. Use a JSON validator (e.g. jsonlint.com).
- **Excel saves with wrong encoding** – Save as “CSV UTF-8” if you see garbled text after conversion.
