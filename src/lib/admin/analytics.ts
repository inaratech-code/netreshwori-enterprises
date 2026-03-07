"use client";

import { logAnalyticsEvent } from "./firestore";

/** Call from the website (e.g. product page) to log a product view. */
export async function trackProductView(productId: string) {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const hour = now.getHours();
  await logAnalyticsEvent({
    type: "product_view",
    productId,
    date,
    hour,
  });
}

/** Call on page load to log a page view. */
export async function trackPageView(page: string) {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const hour = now.getHours();
  await logAnalyticsEvent({
    type: "page_view",
    page,
    date,
    hour,
  });
}
