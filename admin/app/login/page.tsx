"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            const profile = await api.getUserProfile(user.uid);
            if (profile?.role === "Admin") {
                router.push("/");
            } else if (profile?.role === "Driver") {
                router.push("/driver");
            } else {
                setError("Access denied. You do not have permission to access this panel.");
                await auth.signOut();
            }
        } catch {
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
            <div className="w-full max-w-md space-y-8 rounded-xl border bg-white p-10 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                <div className="text-center">
                    <div className="mx-auto mb-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">UE</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Sign In
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Admin &amp; Driver access
                    </p>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleLogin}>
                    <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:text-sm"
                    />
                    <input
                        type="password"
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:text-sm"
                    />
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
