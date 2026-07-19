"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { DriverSidebar } from "@/components/DriverSidebar";
import { Menu } from "lucide-react";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const { role } = useAuth();
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (pathname === "/login") {
        return <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">{children}</div>;
    }

    return (
        <>
            {/* Backdrop */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 md:hidden"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Sidebar / Drawer */}
            <div className={`
                fixed inset-y-0 left-0 z-30 transition-transform duration-300
                md:relative md:translate-x-0
                ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                {role === "Driver"
                    ? <DriverSidebar onClose={() => setDrawerOpen(false)} />
                    : <Sidebar onClose={() => setDrawerOpen(false)} />
                }
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                {/* Mobile top bar */}
                <div className="flex h-14 items-center gap-4 border-b bg-white px-4 dark:bg-zinc-900 dark:border-zinc-800 md:hidden">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                        {role === "Driver" ? "Driver Panel" : "Admin Panel"}
                    </span>
                </div>

                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </>
    );
}
