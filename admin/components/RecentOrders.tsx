import { Order } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    preparing: "bg-blue-100 text-blue-700",
    ready_for_pickup: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export function RecentOrders({ orders }: { orders: Order[] }) {
    return (
        <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-6 pb-2">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Orders</h3>
                <p className="text-sm text-zinc-500">Latest food delivery orders.</p>
            </div>
            <div className="p-6 pt-2">
                <div className="space-y-4">
                    {orders.slice(0, 5).map(order => {
                        const colorClass = STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-500";
                        return (
                            <div key={order.id} className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                                    {(order.restaurantName || "?").substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{order.restaurantName}</p>
                                    <p className="text-xs text-zinc-500 truncate">{order.orderNumber || order.id}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-medium text-zinc-900 dark:text-white text-sm">${order.totalAmount?.toFixed(2)}</span>
                                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${colorClass}`}>
                                        {order.status?.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {orders.length === 0 && <p className="text-sm text-zinc-400 text-center py-4">No orders yet</p>}
                </div>
            </div>
        </div>
    );
}
