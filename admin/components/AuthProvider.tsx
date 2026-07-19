"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

type UserRole = "Admin" | "Driver" | "Customer" | null;

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    role: UserRole;
    isAdmin: boolean;
    isDriver: boolean;
    dbUserId: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    role: null,
    isAdmin: false,
    isDriver: false,
    dbUserId: null,
});

export const useAuth = () => useContext(AuthContext);

const ALLOWED_ROLES = ["Admin", "Driver"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole>(null);
    const [dbUserId, setDbUserId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profile = await api.getUserProfile(firebaseUser.uid);
                    if (profile && ALLOWED_ROLES.includes(profile.role ?? "")) {
                        setUser(firebaseUser);
                        setRole(profile.role as UserRole);
                        setDbUserId(profile.id);
                        // Redirect driver away from admin routes
                        if (profile.role === "Driver" && !pathname.startsWith("/driver") && pathname !== "/login" && pathname !== "/profile") {
                            router.push("/driver");
                        }
                        // Redirect admin away from driver routes
                        if (profile.role === "Admin" && pathname.startsWith("/driver")) {
                            router.push("/");
                        }
                    } else {
                        setUser(null);
                        setRole(null);
                        setDbUserId(null);
                        if (pathname !== "/login") router.push("/login");
                    }
                } catch (error) {
                    console.error("Error verifying role:", error);
                    setUser(null);
                    setRole(null);
                    setDbUserId(null);
                }
            } else {
                setUser(null);
                setRole(null);
                setDbUserId(null);
                if (pathname !== "/login") router.push("/login");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            role,
            isAdmin: role === "Admin",
            isDriver: role === "Driver",
            dbUserId,
        }}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent dark:border-zinc-50" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}
