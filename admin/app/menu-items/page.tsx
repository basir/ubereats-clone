"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search, MoreHorizontal } from "lucide-react";
import { api, MenuItem, Restaurant } from "@/lib/api";
import { MenuItemDialog } from "@/components/MenuItemDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function MenuItemsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [filtered, setFiltered] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<MenuItem | null>(null);
    const [toDelete, setToDelete] = useState<MenuItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([api.getRestaurants(), api.getMenuItems()]).then(([rests, items]) => {
            setRestaurants(rests);
            setMenuItems(items);
            setFiltered(items);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = menuItems;
        if (selectedRestaurant !== "all") result = result.filter(i => i.restaurantId === selectedRestaurant);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
        }
        setFiltered(result);
    }, [searchQuery, selectedRestaurant, menuItems]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSave = async (data: Omit<MenuItem, "id"> | MenuItem) => {
        if ("id" in data) {
            await api.updateMenuItem(data.id, data);
            setMenuItems(prev => prev.map(i => i.id === data.id ? { ...i, ...data } : i));
        } else {
            const created = await api.createMenuItem(data);
            setMenuItems(prev => [created as MenuItem, ...prev]);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!toDelete) return;
        setDeleteLoading(true);
        try {
            await api.deleteMenuItem(toDelete.id);
            setMenuItems(prev => prev.filter(i => i.id !== toDelete.id));
            setIsDeleteOpen(false);
        } catch { alert("Failed to delete"); }
        finally { setDeleteLoading(false); }
    };

    const restaurantName = (id: string) => restaurants.find(r => r.id === id)?.name ?? id;

    if (loading) return <div className="p-8 text-zinc-500">Loading menu items...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Menu Items</h2>
                <button
                    onClick={() => { setSelected(null); setIsDialogOpen(true); }}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                    <Plus className="h-4 w-4" /> Add Menu Item
                </button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                </div>
                <select
                    value={selectedRestaurant}
                    onChange={e => setSelectedRestaurant(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                    <option value="all">All Restaurants</option>
                    {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <span className="text-sm text-zinc-500">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b dark:border-zinc-800">
                            {["Name", "Restaurant", "Category", "Price", "In Stock", "Actions"].map(h => (
                                <th key={h} className="h-12 px-4 align-middle font-medium text-zinc-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No menu items found</td></tr>
                        ) : filtered.map(item => (
                            <tr key={item.id} className="border-b hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{item.name}</td>
                                <td className="px-4 py-3 text-zinc-500">{restaurantName(item.restaurantId)}</td>
                                <td className="px-4 py-3 text-zinc-500">{item.category}</td>
                                <td className="px-4 py-3 text-zinc-900 dark:text-white">${item.price.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                        {item.inStock ? "In Stock" : "Out of Stock"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="relative" ref={openMenuId === item.id ? menuRef : null}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                        </button>
                                        {openMenuId === item.id && (
                                            <div className="absolute right-0 mt-1 w-40 rounded-lg border bg-white shadow-lg dark:bg-zinc-900 dark:border-zinc-800 z-10">
                                                <button onClick={() => { setSelected(item); setIsDialogOpen(true); setOpenMenuId(null); }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-t-lg">
                                                    <Pencil className="h-4 w-4" /> Edit
                                                </button>
                                                <button onClick={() => { setToDelete(item); setIsDeleteOpen(true); setOpenMenuId(null); }}
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

            <MenuItemDialog
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setSelected(null); }}
                onSave={handleSave}
                menuItem={selected}
                restaurants={restaurants}
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
