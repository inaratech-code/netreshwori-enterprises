# Netreshwori Enterprises Website & Admin Panel

This is a fully functional, responsive website and admin panel for "Netreshwori Enterprises" built with Next.js 14, Tailwind CSS, Framer Motion, and Firebase.

## Features

**Public Website:**
- Modern, animated Homepage with Hero Slider, Featured Categories, and Testimonials.
- Real-time Product Catalog with Search and Category Filtering.
- Detailed Product Pages with Image Galleries and Specifications.
- Contact Page with interactive Google Map and Inquiry Form.
- Direct WhatsApp integration for fast communication.
- Fully responsive on mobile, tablet, and desktop.

**Admin Panel:**
- Secure Authentication via Firebase (Email/Password).
- Dashboard overview showing vital statistics.
- Product Management: Add, Edit, Delete products with real-time Firebase syncing.
- Multiple Image Uploads directly to Firebase Storage.
- Testimonial Moderation.
- Simple, beautiful, non-technical friendly UI.

## Getting Started

### 1. Installation

Install all required dependencies:

```bash
npm install
```

### 2. Firebase Configuration

You need to set up a Firebase project to use Authentication, Firestore Database, and Storage.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Authentication** (Email/Password).
3. Enable **Firestore Database** (Start in Test Mode for development, change rules later).
4. Enable **Firebase Storage** (Start in Test Mode).
5. Register a Web App in your Firebase project and get your configuration details.

Rename `.env.local` to `.env.local` (it's already there) and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Running the App

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the public site.
Go to [http://localhost:3000/admin](http://localhost:3000/admin) to access the Admin Panel. (You will need to create a test user in Firebase Auth manually first, or implement a signup route if desired).

### 4. Deployment (Cloudflare or Vercel)

You can deploy to **both** Cloudflare and Vercel; the same repo works on either.

**Cloudflare Workers** (e.g. netreshworienterprises.com.np):

1. `npm install` then `npm run deploy`
2. Add env vars in Cloudflare Dashboard → your Worker → **Settings → Variables and Secrets** (and **Build variables** if using GitHub).
3. Add a custom domain under **Workers & Pages** → your project → **Custom domains**.

→ Full guide: **[DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)**

**Vercel:**

1. In [Vercel](https://vercel.com), import your GitHub repo and create a project.
2. Add the same env vars as in `.env.example` under **Settings → Environment Variables**.
3. Deploy. Vercel runs `npm run build` (Next.js); the Cloudflare packages in `package.json` are installed but not used on Vercel.

## Tech Stack
- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: Lucide React
- Backend/DB: Firebase (Auth, Firestore, Storage)
