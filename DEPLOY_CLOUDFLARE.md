# Deploy to Cloudflare (netreshworienterprises.com.np)

This project is set up to deploy to **Cloudflare Workers** using the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare/), so you get full Next.js (API routes, SSR, dynamic routes) on Cloudflare.

---

## 1. Install dependencies

From the project root:

```bash
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
```

---

## 2. Set environment variables

Your app needs Firebase and optional env vars. Set them in **one** of these ways:

### Option A: Cloudflare Dashboard (recommended for production)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**.
2. After your Worker is created (see step 3), open it → **Settings** → **Variables and Secrets**.
3. Add each variable (see `.env.example`):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | From Firebase Console → Project settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional | Analytics |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Optional | Comma-separated admin emails for /admin |
| `NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL` | Optional | If using filename-only image URLs |
| `NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL_SUFFIX` | Optional | e.g. `?alt=media` for Firebase Storage |

**Important:** For **build-time** (e.g. if you use GitHub Actions or Workers Builds), set the same variables in **Build Variables and secrets** so the Next.js build can read them.

### Option B: Local `.dev.vars` (preview only)

For `npm run preview`, create a file `.dev.vars` in the project root (do not commit it; it’s in `.gitignore`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

---

## 3. Deploy

### Deploy from your machine

```bash
npm run deploy
```

You’ll be prompted to log in to Cloudflare (if not already). The first time, Wrangler will create a new Worker. After deploy you’ll get a URL like `https://netreshwori-website.<your-subdomain>.workers.dev`.

### Connect custom domain (netreshworienterprises.com.np)

1. In [Cloudflare Dashboard](https://dash.cloudflare.com) go to **Workers & Pages** → your project (**netreshwori-website**).
2. Open **Custom domains** → **Set up a custom domain**.
3. Enter **netreshworienterprises.com.np**.
4. If the domain is not on Cloudflare, you’ll add the DNS records Cloudflare shows (at your domain registrar or DNS provider). If the domain is already on Cloudflare, the record can be added automatically.
5. Wait for SSL to be issued. The site will then be available at `https://netreshworienterprises.com.np`.

---

## 4. Automatic deploys from GitHub (optional)

1. In Cloudflare: **Workers & Pages** → **Create** → **Connect to Git**.
2. Choose **GitHub**, authorize, and select the repo **inaratech-code/netreshwori-enterprises** (or your fork).
3. **Build settings** (Settings → Build):
   - **Build command:** `npm install && npx opennextjs-cloudflare build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** (leave empty if the app is at repo root)
4. Under **Build variables and secrets**, add every Firebase and `NEXT_PUBLIC_*` variable from step 2 so the Next.js build can read them.
5. Save. Pushes to your production branch will build and deploy. The Worker name in the dashboard must match `name` in `wrangler.jsonc` (**netreshwori-website**).

---

## 5. Useful commands

| Command | Description |
|--------|-------------|
| `npm run dev` | Local Next.js dev server (unchanged). |
| `npm run preview` | Build and run locally in Cloudflare’s runtime (Wrangler). |
| `npm run deploy` | Build and deploy to Cloudflare Workers. |
| `npm run cf-typegen` | Generate TypeScript types for Cloudflare env (optional). |

---

## 6. Troubleshooting

- **Build fails:** Ensure Node.js is 18+. Run `npm run build` first; if that passes, run `npm run deploy`.
- **Firebase / blank page:** Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set in Cloudflare (Variables and Secrets) and, if using CI, in Build variables.
- **Custom domain not working:** In Cloudflare, check **Workers & Pages** → your Worker → **Custom domains** and DNS (CNAME or A/AAAA) at your registrar.
- **Admin redirect / 403:** Set `NEXT_PUBLIC_ADMIN_EMAILS` to a comma-separated list of allowed admin emails.

For more on OpenNext on Cloudflare: [opennext.js.org/cloudflare](https://opennext.js.org/cloudflare/).
