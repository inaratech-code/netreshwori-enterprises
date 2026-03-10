# Before Going Live – Checklist

Your **live site reads products from Firebase Firestore**, not from the CSV file. The CSV in `src/data/products.csv` is only used to **import** data into Firebase. Do these steps before (or right after) deploying.

---

## 1. Create categories and brands in Firebase

Product rows in your CSV reference **category** and **brand** by name. Those must exist in Firestore first.

**Option A – Admin panel (after deploy):**

1. Deploy the site and open **Admin** (e.g. `https://yoursite.com/admin`).
2. Log in with an admin user (see step 4 below).
3. Go to **Admin → Categories**. Add every category your CSV uses (e.g. `Wall/floor tile`, `floor tile`).
4. Go to **Admin → Brands**. Add every brand your CSV uses (e.g. `Iscon`, `Nepovit`).

**Option B – Seed scripts (before or after deploy):**

- Run `npm run seed-categories` and `npm run seed-brands` if you have set up Firebase Admin (service account). These use `src/data/partners.json` and may create some defaults; add any missing categories/brands in Admin.

---

## 2. Import your CSV into Firebase

Choose one method.

### Method A – Command line (best for large CSV, e.g. `src/data/products.csv`)

1. **Firebase service account (one-time)**  
   - Firebase Console → Project settings → **Service accounts** → **Generate new private key**.  
   - Save the downloaded JSON as **`scripts/service-account.json`** in this project.  
   - Do **not** commit it (it’s in `.gitignore`).

2. **Convert CSV → JSON and import:**
   ```bash
   npm run import-products
   ```
   This runs: `csv-to-json.js src/data/products.csv` → `products-import.json` → `bulk-import-products.js` into Firestore.

3. If your CSV is **not** at `src/data/products.csv`, run:
   ```bash
   npm run csv-to-json -- path/to/your/products.csv -o products-import.json
   node scripts/bulk-import-products.js products-import.json
   ```

### Method B – Admin panel (no service account)

1. Convert CSV to JSON on your machine:
   ```bash
   npm run csv-to-json -- src/data/products.csv -o products-import.json
   ```
2. Open **Admin → Products → Bulk Import**.
3. Either upload `products-import.json` or paste its contents, then click **Import**.

Your CSV uses **image 1, image 2, image 3** columns and Google Drive links; the importer supports multiple image columns and the site can show Drive links as images (share each file “Anyone with the link” for viewing).

---

## 3. Environment variables on the live site

On **Vercel** or **Cloudflare**, set the same variables you use locally (see `.env.example`):

- All **`NEXT_PUBLIC_FIREBASE_*`** values (required).
- **`NEXT_PUBLIC_ADMIN_EMAILS`** (comma-separated) so only those emails can open `/admin`.

---

## 4. First admin user

- **Firebase Console** → **Authentication** → **Users** → add a user with the email you want to use as admin.
- Add that same email to **`NEXT_PUBLIC_ADMIN_EMAILS`** in your deployment (e.g. Vercel/Cloudflare env vars).

Then you can log in at `https://yoursite.com/login` and use Admin.

---

## 4b. Firebase Authorized domains (for OAuth / login)

If you see in the browser console: **"The current domain is not authorized for OAuth operations"**:

1. Open **Firebase Console** → **Authentication** → **Settings** (or **Sign-in method** tab) → **Authorized domains**.
2. Click **Add domain** and add every URL where the app runs:
   - Your production domain (e.g. `netreshworienterprises.com.np`, `www.netreshworienterprises.com.np`).
   - Your Cloudflare Worker URL (e.g. `netreshwori-enterprises.inaratech2025.workers.dev`).

Without these, `signInWithPopup` / `signInWithRedirect` and admin login will not work on the deployed site.

---

## 5. Optional: Bosch Display font (avoid 404)

The site references **Bosch Display** in `globals.css` (`/fonts/BoschDisplay-Regular.woff2` and `.woff`). If those files are missing, the browser will 404 and the console will show failed font requests. To fix:

- Add `BoschDisplay-Regular.woff2` and `BoschDisplay-Regular.woff` into **`public/fonts/`** (e.g. from [iframefonts.com](https://iframefonts.com/fonts/bosch-display-font/) if you have a license), or
- Leave as-is; the `.font-bosch` class will fall back to Georgia/serif and the site still works.

---

## 5b. Analytics (Admin Dashboard): Firestore index

If **Admin → Analytics** (or the dashboard charts) shows no data and the browser console has a Firestore error about a missing index:

1. Open the **link in the error message** (Firebase Console → create index for `analytics_events`).
2. Or in **Firebase Console** → **Firestore** → **Indexes** → **Composite** → add:
   - Collection: `analytics_events`
   - Field: `date` (Ascending)
   - Query scope: Collection

After the index finishes building, analytics and dashboard charts will show visitors and product views.

---

## 6. Optional: CSV file in the repo

- **Keep `src/data/products.csv`**  
  Useful as backup and for re-running imports (e.g. after changing categories/brands). It is **not** served to visitors; only the import scripts and Admin use it.

- **Stop tracking it**  
  If you prefer not to keep the CSV in git, add to `.gitignore`:
  ```text
  src/data/products.csv
  ```
  Then run the import (step 2) before deploying, or keep a copy elsewhere and use Method A or B when needed.

---

## Quick order of operations

| Order | Step |
|-------|------|
| 1 | Create categories and brands (Admin or seed). |
| 2 | Import CSV into Firestore (CLI or Admin Bulk Import). |
| 3 | Set env vars and admin email on the live deployment. |
| 4 | Deploy; log in to Admin and confirm products and images load. |

After that, the live site will show your products from Firebase; the CSV is only for that one-time (or occasional) import.
