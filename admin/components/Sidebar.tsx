"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, UtensilsCrossed, ShoppingBag, Users, LogOut, Sun, Moon, UserCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Restaurants", href: "/restaurants", icon: Store },
    { name: "Menu Items", href: "/menu-items", icon: UtensilsCrossed },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Users", href: "/users", icon: Users },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const { user } = useAuth();

    const handleSignOut = async () => {
        try { await auth.signOut(); router.push("/login"); } catch (e) { console.error(e); }
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-16 items-center border-b px-6 dark:border-zinc-800 gap-2">
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">UE</span>
                </div>
                <span className="text-lg text-black dark:text-white font-bold">Admin Panel</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navItems.map(item => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={twMerge(clsx(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                            ))}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t p-4 dark:border-zinc-800">
                <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                    {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                    <UserCircle className="h-5 w-5 shrink-0" />
                    <span className="truncate">{user?.email ?? "Profile"}</span>
                </Link>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
