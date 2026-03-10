"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        Promise.all([import("@/lib/firebase"), import("firebase/auth")]).then(([{ auth }, { onAuthStateChanged }]) => {
            if (!auth) {
                setLoading(false);
                return;
            }
            unsubscribe = onAuthStateChanged(auth, (u) => {
                setUser(u);
                setLoading(false);
            });
        }).catch(() => setLoading(false));
        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            const [{ auth }, { signOut: firebaseSignOut }] = await Promise.all([
                import("@/lib/firebase"),
                import("firebase/auth"),
            ]);
            if (auth) await firebaseSignOut(auth);
        } catch {
            // ignore if Firebase not available
        }
        document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
