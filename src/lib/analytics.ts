import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "@/lib/firebase";

export type EventType = 'page_view' | 'product_view' | 'inquiry';

export const trackEvent = async (type: EventType, data: Record<string, unknown> = {}) => {
    try {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const hour = now.getHours();

        await addDoc(collection(db, 'analytics_events'), {
            type,
            date,
            hour,
            timestamp: serverTimestamp(),
            ...data,
        });
    } catch (error) {
        console.error('Error tracking event:', error);
    }
};

export const trackPageVisit = (pageName: string) => {
    return trackEvent('page_view', { page: pageName });
};

export const trackProductView = (productId: string) => {
    return trackEvent('product_view', { productId });
};

export const trackInquiry = (productId?: string) => {
    return trackEvent('inquiry', { productId });
};
