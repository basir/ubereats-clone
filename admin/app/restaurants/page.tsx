"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search, MoreHorizontal } from "lucide-react";
import { api, Restaurant } from "@/lib/api";
import { RestaurantDialog } from "@/components/RestaurantDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filtered, setFiltered] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Restaurant | null>(null);
    const [toDelete, setToDelete] = useState<Restaurant | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchRestaurants(); }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setFiltered(restaurants); return; }
        const q = searchQuery.toLowerCase();
        setFiltered(restaurants.filter(r =>
            r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q)
        ));
    }, [searchQuery, restaurants]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchRestaurants = async () => {
        try {
            const data = await api.getRestaurants();
            setRestaurants(data);
            setFiltered(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (data: Omit<Restaurant, "id"> | Restaurant) => {
        if ("id" in data) {
            await api.updateRestaurant(data.id, data);
            setRestaurants(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
        } else {
            const created = await api.createRestaurant(data);
            setRestaurants(prev => [created as Restaurant, ...prev]);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!toDelete) return;
        setDeleteLoading(true);
        try {
            await api.deleteRestaurant(toDelete.id);
            setRestaurants(prev => prev.filter(r => r.id !== toDelete.id));
            setIsDeleteOpen(false);
        } catch (e) { alert("Failed to delete"); }
        finally { setDeleteLoading(false); }
    };

    if (loading) return <div className="p-8 text-zinc-500">Loading restaurants...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Restaurants</h2>
                <button
                    onClick={() => { setSelected(null); setIsDialogOpen(true); }}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                    <Plus className="h-4 w-4" /> Add Restaurant
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search restaurants..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                </div>
                <span className="text-sm text-zinc-500">{filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b dark:border-zinc-800">
                            {["Name", "Cuisine", "Address", "Rating", "Delivery Time", "Delivery Fee", "Status", "Actions"].map(h => (
                                <th key={h} className="h-12 px-4 align-middle font-medium text-zinc-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} className="p-8 text-center text-zinc-500">No restaurants found</td></tr>
                        ) : filtered.map(r => (
                            <tr key={r.id} className="border-b hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{r.name}</td>
                                <td className="px-4 py-3 text-zinc-500">{r.cuisineType}</td>
                                <td className="px-4 py-3 text-zinc-500 max-w-[180px] truncate">{r.address}</td>
                                <td className="px-4 py-3 text-zinc-500">{r.rating}</td>
                                <td className="px-4 py-3 text-zinc-500">{r.deliveryTimeEst} min</td>
                                <td className="px-4 py-3 text-zinc-500">${r.deliveryFee}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                                        {r.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="relative" ref={openMenuId === r.id ? menuRef : null}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                        </button>
                                        {openMenuId === r.id && (
                                            <div className="absolute right-0 mt-1 w-40 rounded-lg border bg-white shadow-lg dark:bg-zinc-900 dark:border-zinc-800 z-10">
                                                <button onClick={() => { setSelected(r); setIsDialogOpen(true); setOpenMenuId(null); }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-t-lg">
                                                    <Pencil className="h-4 w-4" /> Edit
                                                </button>
                                                <button onClick={() => { setToDelete(r); setIsDeleteOpen(true); setOpenMenuId(null); }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-zinc-50 rounded-b-lg">
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <RestaurantDialog
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setSelected(null); }}
                onSave={handleSave}
                restaurant={selected}
            />
            <DeleteConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => { setIsDeleteOpen(false); setToDelete(null); }}
                onConfirm={handleDeleteConfirm}
                productName={toDelete?.name || ""}
                loading={deleteLoading}
            />
        </div>
    );
}
