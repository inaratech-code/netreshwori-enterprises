# Firebase setup for Netreshwori website

This app uses **Firebase Auth**, **Firestore**, and **Storage**. Follow these steps to connect your project.

---

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or use an existing one).
3. Enter a name (e.g. `netreshwori-website`) and follow the steps.
4. You can disable Google Analytics if you don’t need it.

---

## 2. Register a web app and get config

1. In the project overview, click the **Web** icon (`</>`).
2. Register the app with a nickname (e.g. `Netreshwori Web`). Don’t enable Firebase Hosting if you’re deploying elsewhere.
3. Copy the **firebaseConfig** object (apiKey, authDomain, projectId, etc.).

---

## 3. Add config to your app

1. In the project root, copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and paste your values (no quotes needed):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```
3. Restart the dev server: `npm run dev`.

---

## 4. Enable Authentication (Email/Password)

1. In Firebase Console go to **Build → Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Email/Password** (first provider in the list).
5. (Optional) Add an admin user: **Authentication → Users → Add user** with the email/password you’ll use for `/login` and the admin dashboard.

---

## 5. Create Firestore database

1. Go to **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in test mode** for development (you can lock rules later).
4. Pick a location close to your users (e.g. `asia-south1` for Nepal).
5. Click **Enable**.

The app uses these collections (they’ll be created when you use the admin panel):

- `products` – product listings
- `categories` – product categories
- `testimonials` – testimonials
- `analytics_events` – optional analytics
- `inquiries` – if you add a contact form backend
- `settings` – site settings (admin)

---

## 6. Enable Storage

1. Go to **Build → Storage**.
2. Click **Get started**.
3. Use the default **test mode** for development (restrict later with rules).
4. Choose the same region as Firestore and click **Done**.

Storage is used for **product images** uploaded in the admin panel (`/admin/products`).

---

## 7. (Optional) Secure Firestore and Storage

When you’re ready for production:

1. **Firestore**: **Firestore → Rules**. Replace test mode with rules that:
   - Allow read for public data (e.g. products, categories, testimonials).
   - Allow write only for authenticated users (or specific admin UIDs).
2. **Storage**: **Storage → Rules**. Allow read for public URLs; allow create/update only for authenticated (or admin) users.

Example Firestore rules (adjust to your needs):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products { allow read: if true; allow write: if request.auth != null; }
    match /categories { allow read: if true; allow write: if request.auth != null; }
    match /testimonials { allow read: if true; allow write: if request.auth != null; }
    match /settings { allow read: if true; allow write: if request.auth != null; }
  }
}
```

---

## Quick checklist

- [ ] Firebase project created
- [ ] Web app registered and config copied to `.env.local`
- [ ] Email/Password auth enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] (Optional) Admin user created in Authentication
- [ ] Dev server restarted after adding env vars

After this, **Login** (`/login`), **Admin** (`/admin`), **Products**, **Categories**, and **Testimonials** will use your Firebase project.
