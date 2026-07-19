"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Store, Users } from "lucide-react";
import { OverviewChart } from "@/components/OverviewChart";
import { RecentOrders } from "@/components/RecentOrders";
import { StatsCard } from "@/components/StatsCard";
import { DashboardMap } from "@/components/DashboardMap";
import { api, Order } from "@/lib/api";

type DashboardMode = "map" | "list";

export default function Home() {
    const [mode, setMode] = useState<DashboardMode>("map");
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalRestaurants: 0,
        totalUsers: 0,
    });
    const [orders, setOrders] = useState<Order[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<{ name: string; total: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, ordersData, monthlyData] = await Promise.all([
                    api.getStats(),
                    api.getOrders(),
                    api.getMonthlyRevenue(),
                ]);
                setStats(statsData);
                setOrders(ordersData.slice(0, 5));
                setMonthlyRevenue(monthlyData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-zinc-500">Loading dashboard...</div>;

    // Map mode: negative margin cancels layout p-8, fills remaining space beside sidebar
    if (mode === "map") {
        return (
            <div className="-m-4 md:-m-8" style={{ height: "calc(100vh)", overflow: "hidden" }}>
                <DashboardMap
                    onModeChange={setMode}
                />
            </div>
        );
    }

    // List mode: normal layout, app chrome stays at its own default theme
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h2>
                <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                        onClick={() => setMode("map")}
                        className="flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all"
                    >
                        🗺 Map
                    </button>
                    <button className="flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900">
                        ☰ List
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} description="All-time earnings" />
                <StatsCard title="Total Orders" value={stats.totalOrders.toString()} icon={ShoppingBag} description="Orders placed" />
                <StatsCard title="Restaurants" value={stats.totalRestaurants.toString()} icon={Store} description="Active merchants" />
                <StatsCard title="Users" value={stats.totalUsers.toString()} icon={Users} description="Registered users" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                    <OverviewChart data={monthlyRevenue} />
                </div>
                <div className="col-span-full lg:col-span-3">
                    <RecentOrders orders={orders} />
                </div>
            </div>
        </div>
    );
}
