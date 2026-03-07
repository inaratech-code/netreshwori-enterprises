import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
      <p className="text-slate-600 mb-6">This page could not be found.</p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
