"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api, Order } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
    out_for_delivery: "bg-orange-100 text-orange-700",
    ready_for_pickup: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
};

export default function DriverDeliveriesPage() {
    const { dbUserId } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [available, setAvailable] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null);

    const load = async () => {
        if (!dbUserId) return;
        const [driverOrders, avail] = await Promise.all([
            api.getDriverOrders(dbUserId),
            api.getAvailableOrders(),
        ]);
        setOrders(driverOrders
            .filter(o => o.status !== "delivered" && o.status !== "cancelled")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
        setAvailable(avail);
        setLoading(false);
    };

    useEffect(() => { load(); }, [dbUserId]);

    const handleMarkDelivered = async (orderId: string) => {
        setUpdatingId(orderId);
        try {
            await api.updateOrderStatus(orderId, "delivered");
            await load();
        } finally { setUpdatingId(null); }
    };

    const handleAccept = async (orderId: string) => {
        if (!dbUserId) return;
        setAssigningId(orderId);
        try {
            await api.assignOrderToDriver(orderId, dbUserId);
            await load();
        } finally { setAssigningId(null); }
    };

    if (loading) return <div className="text-zinc-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Active Deliveries</h2>

            {available.length > 0 && (
                <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                    <div className="border-b px-6 py-4 dark:border-zinc-800">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Available for Pickup</h3>
                    </div>
                    <div className="divide-y dark:divide-zinc-800">
                        {available.map(order => (
                            <div key={order.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white">{order.restaurantName}</p>
                                    <p className="text-sm text-zinc-500">
                                        {order.orderNumber} · {order.items?.length} items · ${order.totalAmount?.toFixed(2)}
                                        {order.driverTip > 0 && <span className="text-green-600"> +${order.driverTip.toFixed(2)} tip</span>}
                                    </p>
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

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                <div className="border-b px-6 py-4 dark:border-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">My Active Orders</h3>
                </div>
                {orders.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-zinc-500">No active orders assigned to you</p>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b dark:border-zinc-800">
                                    {["Order #", "Restaurant", "Deliver To", "Total", "Status", "Action"].map(h => (
                                        <th key={h} className="h-12 px-4 font-medium text-zinc-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{order.orderNumber}</td>
                                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{order.restaurantName}</td>
                                        <td className="px-4 py-3 text-zinc-500">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</td>
                                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">${order.totalAmount?.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                                                {order.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.status === "out_for_delivery" && (
                                                <button
                                                    onClick={() => handleMarkDelivered(order.id)}
                                                    disabled={updatingId === order.id}
                                                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {updatingId === order.id ? "..." : "Mark Delivered"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
