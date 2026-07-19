"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api, Order } from "@/lib/api";

export default function DriverHistoryPage() {
    const { dbUserId } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dbUserId) return;
        api.getDriverOrders(dbUserId).then(data => {
            setOrders(
                data
                    .filter(o => o.status === "delivered")
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
        }).finally(() => setLoading(false));
    }, [dbUserId]);

    if (loading) return <div className="text-zinc-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Delivery History</h2>

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b dark:border-zinc-800">
                            {["Order #", "Restaurant", "Delivered To", "Date", "Total", "Tip"].map(h => (
                                <th key={h} className="h-12 px-4 font-medium text-zinc-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">No delivery history yet</td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="border-b hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{order.orderNumber}</td>
                                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{order.restaurantName}</td>
                                <td className="px-4 py-3 text-zinc-500">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</td>
                                <td className="px-4 py-3 text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">${order.totalAmount?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-green-600 font-medium">+${(order.driverTip ?? 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
