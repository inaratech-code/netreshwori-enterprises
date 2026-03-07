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

### 4. Deployment (Vercel)

The app is set up for deployment on [Vercel](https://vercel.com/).

1. Push your code to a GitHub (or GitLab/Bitbucket) repository.
2. In [Vercel](https://vercel.com/), import the repository and create a project.
3. **Environment variables:** In the project **Settings → Environment Variables**, add the same variables you use in `.env.local`. Use `.env.example` as a checklist. Required for the app to work:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   Optional: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated), `NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL`, `NEXT_PUBLIC_PRODUCT_IMAGES_BASE_URL_SUFFIX`.
4. Deploy. Vercel will run `npm run build` and then serve the app. Do not set `output: 'export'` in `next.config.mjs` unless you intend a static export.

## Tech Stack
- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: Lucide React
- Backend/DB: Firebase (Auth, Firestore, Storage)
