"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-600 mb-6 text-center max-w-md">{error.message}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
