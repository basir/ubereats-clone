"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, MapPin, CheckCircle } from "lucide-react";
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

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (typeof params.id === "string") {
            api.getOrder(params.id).then(data => setOrder(data)).catch(console.error).finally(() => setLoading(false));
        }
    }, [params.id]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            await api.updateOrderStatus(order.id, newStatus);
            setOrder({ ...order, status: newStatus });
        } catch (e) { console.error(e); }
        finally { setUpdating(false); }
    };

    if (loading) return <div className="p-8 text-zinc-500">Loading order details...</div>;
    if (!order) return <div className="p-8 text-zinc-500">Order not found</div>;

    const colorClass = STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-500";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Order {order.orderNumber || `#${order.id}`}</h2>
                    <p className="text-sm text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-white">
                            <Package className="h-5 w-5" /> Order Items
                        </h3>
                        <div className="space-y-3">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-white">{item.name}</p>
                                        <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-zinc-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-zinc-800 space-y-1">
                            <div className="flex justify-between text-sm text-zinc-500">
                                <span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-zinc-500">
                                <span>Delivery Fee</span><span>${order.deliveryFee?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-zinc-500">
                                <span>Service Fee</span><span>${order.serviceFee?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-zinc-500">
                                <span>Driver Tip</span><span>${order.driverTip?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-zinc-900 dark:text-white pt-1">
                                <span>Total</span><span>${order.totalAmount?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-white">
                            <MapPin className="h-5 w-5" /> Delivery Info
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-zinc-500">From (Restaurant)</p>
                                <p className="font-medium text-zinc-900 dark:text-white">{order.restaurantName}</p>
                                {order.restaurantLocation && (
                                    <p className="text-zinc-400 text-xs">
                                        {order.restaurantLocation.latitude.toFixed(5)}, {order.restaurantLocation.longitude.toFixed(5)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-zinc-500">To (Customer)</p>
                                <p className="font-medium text-zinc-900 dark:text-white">{order.deliveryAddress?.street}</p>
                                {order.deliveryAddress?.latitude && (
                                    <p className="text-zinc-400 text-xs">
                                        {order.deliveryAddress.latitude.toFixed(5)}, {order.deliveryAddress.longitude.toFixed(5)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status */}
                    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-white">
                            <CheckCircle className="h-5 w-5" /> Order Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-500">Current</span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                                    {order.status?.replace(/_/g, " ")}
                                </span>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-900 dark:text-white block mb-1">Update Status</label>
                                <select
                                    value={order.status}
                                    onChange={e => handleStatusUpdate(e.target.value)}
                                    disabled={updating}
                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                                >
                                    {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status History */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                            <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-white">Status History</h3>
                            <div className="space-y-2">
                                {[...order.statusHistory].reverse().map((h, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">{h.status.replace(/_/g, " ")}</span>
                                        <span className="text-zinc-400">{new Date(h.date).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
