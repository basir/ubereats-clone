"use client";

import { useEffect, useState } from "react";
import { PackageCheck, DollarSign, Star, Clock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api, Order, User } from "@/lib/api";
import { StatsCard } from "@/components/StatsCard";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
    out_for_delivery: "bg-orange-100 text-orange-700",
    ready_for_pickup: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
};

export default function DriverDashboard() {
    const { dbUserId } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [available, setAvailable] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigningId, setAssigningId] = useState<string | null>(null);

    useEffect(() => {
        if (!dbUserId) return;
        const load = async () => {
            try {
                const [users, driverOrders, avail] = await Promise.all([
                    api.getUsers(),
                    api.getDriverOrders(dbUserId),
                    api.getAvailableOrders(),
                ]);
                const p = users.find(u => u.id === dbUserId) ?? null;
                setProfile(p);
                setOrders(driverOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                setAvailable(avail);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dbUserId]);

    const handleAccept = async (orderId: string) => {
        if (!dbUserId) return;
        setAssigningId(orderId);
        try {
            await api.assignOrderToDriver(orderId, dbUserId);
            const [driverOrders, avail] = await Promise.all([
                api.getDriverOrders(dbUserId),
                api.getAvailableOrders(),
            ]);
            setOrders(driverOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setAvailable(avail);
        } finally {
            setAssigningId(null);
        }
    };

    if (loading) return <div className="text-zinc-500">Loading...</div>;

    const activeOrders = orders.filter(o => o.status === "out_for_delivery");
    const todayDeliveries = orders.filter(o => {
        const d = new Date(o.createdAt);
        const today = new Date();
        return o.status === "delivered" &&
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
    });

    const earnings = profile?.earnings;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Welcome back, {profile?.name?.split(" ")[0] ?? "Driver"}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">{profile?.vehicle}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Online
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Today's Deliveries" value={todayDeliveries.length.toString()} icon={PackageCheck} description="Completed today" />
                <StatsCard title="Today's Earnings" value={`$${(earnings?.today ?? 0).toFixed(2)}`} icon={DollarSign} description="Tips included" />
                <StatsCard title="Rating" value={(profile?.rating ?? 0).toFixed(1)} icon={Star} description={`${profile?.ratingCount ?? 0} ratings`} />
                <StatsCard title="Active Orders" value={activeOrders.length.toString()} icon={Clock} description="In progress" />
            </div>

            {/* Available orders to pick up */}
            {available.length > 0 && (
                <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                    <div className="border-b px-6 py-4 dark:border-zinc-800">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Available for Pickup</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Orders ready at restaurant — accept to start delivery</p>
                    </div>
                    <div className="divide-y dark:divide-zinc-800">
                        {available.map(order => (
                            <div key={order.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white">{order.restaurantName}</p>
                                    <p className="text-sm text-zinc-500">{order.orderNumber} · {order.items?.length} items · ${order.totalAmount?.toFixed(2)}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
                                </div>
                                <button
                                    onClick={() => handleAccept(order.id)}
                                    disabled={assigningId === order.id}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {assigningId === order.id ? "Accepting..." : "Accept"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active deliveries */}
            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Active Deliveries</h3>
                    <Link href="/driver/deliveries" className="text-sm text-blue-600 hover:underline">View all</Link>
                </div>
                {activeOrders.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-zinc-500">No active deliveries right now</p>
                ) : (
                    <div className="divide-y dark:divide-zinc-800">
                        {activeOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white">{order.restaurantName}</p>
                                    <p className="text-sm text-zinc-500">{order.orderNumber} · ${order.totalAmount?.toFixed(2)}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
                                </div>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS["out_for_delivery"]}`}>
                                    Out for delivery
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
