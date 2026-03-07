"use client";

import { createContext, useContext, useCallback, useRef, ReactNode } from "react";

type CacheKey = "products" | "categories" | "categoriesWithCount" | "brands" | "testimonials" | "inquiries";
type CacheEntry<T> = { data: T; at: number };

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

const AdminCacheContext = createContext<{
    get: <T>(key: CacheKey) => T | null;
    set: <T>(key: CacheKey, data: T) => void;
    invalidate: (key: CacheKey) => void;
} | null>(null);

export function AdminCacheProvider({ children }: { children: ReactNode }) {
    const cacheRef = useRef<Record<CacheKey, CacheEntry<unknown> | undefined>>({});

    const get = useCallback(<T,>(key: CacheKey): T | null => {
        const entry = cacheRef.current[key] as CacheEntry<T> | undefined;
        if (!entry) return null;
        if (Date.now() - entry.at > CACHE_TTL_MS) return null;
        return entry.data;
    }, []);

    const set = useCallback(<T,>(key: CacheKey, data: T) => {
        cacheRef.current[key] = { data, at: Date.now() };
    }, []);

    const invalidate = useCallback((key: CacheKey) => {
        delete cacheRef.current[key];
    }, []);

    return (
        <AdminCacheContext.Provider value={{ get, set, invalidate }}>
            {children}
        </AdminCacheContext.Provider>
    );
}

export function useAdminCache() {
    const ctx = useContext(AdminCacheContext);
    return ctx ?? { get: () => null, set: () => {}, invalidate: () => {} };
}
