"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
      <p className="text-slate-600 mb-6 text-center max-w-md">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
