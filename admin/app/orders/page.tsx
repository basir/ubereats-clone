"use client";

import { useEffect, useState } from "react";
import { Search, Eye } from "lucide-react";
import Link from "next/link";
import { api, Order } from "@/lib/api";

const STATUS_FLOW = ["pending", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    preparing: "bg-blue-100 text-blue-700",
    ready_for_pickup: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        api.getOrders().then(data => {
            setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }).finally(() => setLoading(false));
    }, []);

    const handleAdvanceStatus = async (order: Order) => {
        const idx = STATUS_FLOW.indexOf(order.status);
        if (idx < 0 || idx >= STATUS_FLOW.length - 2) return; // don't advance past out_for_delivery here
        const nextStatus = STATUS_FLOW[idx + 1];
        setUpdatingId(order.id);
        try {
            await api.updateOrderStatus(order.id, nextStatus);
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o));
        } finally { setUpdatingId(null); }
    };

    const filtered = orders.filter(o => {
        const matchesSearch = !searchQuery.trim() ||
            o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.userId?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const nextStatusLabel: Record<string, string> = {
        pending: "Accept",
        preparing: "Mark Preparing",
        ready_for_pickup: "Ready for Pickup",
        out_for_delivery: "Dispatch",
    };

    if (loading) return <div className="p-8 text-zinc-500">Loading orders...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Orders</h2>

            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by order #, restaurant..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                    <option value="all">All Statuses</option>
                    {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
            </div>

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b dark:border-zinc-800">
                            {["Order #", "Restaurant", "Date", "Items", "Total", "Status", "Actions"].map(h => (
                                <th key={h} className="h-12 px-4 align-middle font-medium text-zinc-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No orders found</td></tr>
                        ) : filtered.map(order => {
                            const colorClass = STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-500";
                            const canAdvance = STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 2 &&
                                order.status !== "delivered" && order.status !== "cancelled";
                            return (
                                <tr key={order.id} className="border-b hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{order.orderNumber || order.id}</td>
                                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{order.restaurantName}</td>
                                    <td className="px-4 py-3 text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-zinc-500">{order.items?.length || 0} items</td>
                                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">${order.totalAmount?.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                                            {order.status?.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {canAdvance && (
                                                <button
                                                    onClick={() => handleAdvanceStatus(order)}
                                                    disabled={updatingId === order.id}
                                                    className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {updatingId === order.id ? "..." : "→ " + (STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] || "").replace(/_/g, " ")}
                                                </button>
                                            )}
                                            <Link href={`/orders/${order.id}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                <Eye className="h-4 w-4 text-zinc-500" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
