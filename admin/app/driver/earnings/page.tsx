"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api, Order, User } from "@/lib/api";

function EarningCard({ label, amount }: { label: string; amount: number }) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">${amount.toFixed(2)}</p>
        </div>
    );
}

export default function DriverEarningsPage() {
    const { dbUserId } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dbUserId) return;
        const load = async () => {
            const [users, driverOrders] = await Promise.all([
                api.getUsers(),
                api.getDriverOrders(dbUserId),
            ]);
            setProfile(users.find(u => u.id === dbUserId) ?? null);
            setOrders(
                driverOrders
                    .filter(o => o.status === "delivered")
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
            setLoading(false);
        };
        load();
    }, [dbUserId]);

    if (loading) return <div className="text-zinc-500">Loading...</div>;

    const earnings = profile?.earnings;

    // Group delivered orders by date for the breakdown table
    const byDate: Record<string, { orders: number; tips: number; deliveryFees: number; total: number }> = {};
    orders.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString();
        if (!byDate[date]) byDate[date] = { orders: 0, tips: 0, deliveryFees: 0, total: 0 };
        byDate[date].orders += 1;
        byDate[date].tips += o.driverTip ?? 0;
        byDate[date].deliveryFees += o.deliveryFee ?? 0;
        byDate[date].total += (o.driverTip ?? 0) + (o.deliveryFee ?? 0);
    });

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Earnings</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <EarningCard label="Today" amount={earnings?.today ?? 0} />
                <EarningCard label="This Week" amount={earnings?.thisWeek ?? 0} />
                <EarningCard label="This Month" amount={earnings?.thisMonth ?? 0} />
                <EarningCard label="All Time" amount={earnings?.allTime ?? 0} />
            </div>

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-auto">
                <div className="border-b px-6 py-4 dark:border-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Breakdown by Day</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Calculated from your completed deliveries</p>
                </div>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b dark:border-zinc-800">
                            {["Date", "Deliveries", "Tips", "Delivery Fees", "Total"].map(h => (
                                <th key={h} className="h-12 px-4 font-medium text-zinc-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(byDate).length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500">No earnings data yet</td></tr>
                        ) : Object.entries(byDate).map(([date, row]) => (
                            <tr key={date} className="border-b hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{date}</td>
                                <td className="px-4 py-3 text-zinc-500">{row.orders}</td>
                                <td className="px-4 py-3 text-green-600 font-medium">+${row.tips.toFixed(2)}</td>
                                <td className="px-4 py-3 text-zinc-500">${row.deliveryFees.toFixed(2)}</td>
                                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">${row.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
