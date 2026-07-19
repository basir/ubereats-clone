"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { MenuItem, Restaurant } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<MenuItem, "id"> | MenuItem) => Promise<void>;
    menuItem: MenuItem | null;
    restaurants: Restaurant[];
}

const EMPTY: Omit<MenuItem, "id"> = {
    restaurantId: "",
    name: "",
    price: 0,
    description: "",
    image: "",
    category: "",
    inStock: true,
    customizable: false,
};

const CATEGORIES = ["Appetizers", "Mains", "Sides", "Desserts", "Drinks", "Specials"];

export function MenuItemDialog({ isOpen, onClose, onSave, menuItem, restaurants }: Props) {
    const [form, setForm] = useState<Omit<MenuItem, "id">>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (menuItem) {
            const { id, ...rest } = menuItem;
            setForm(rest);
        } else {
            setForm({ ...EMPTY, restaurantId: restaurants[0]?.id || "" });
        }
        setError("");
    }, [menuItem, isOpen, restaurants]);

    const set = (key: keyof typeof EMPTY, value: any) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError("Name is required"); return; }
        if (!form.restaurantId) { setError("Select a restaurant"); return; }
        setLoading(true);
        try {
            if (menuItem) await onSave({ id: menuItem.id, ...form });
            else await onSave(form);
            onClose();
        } catch { setError("Failed to save item"); }
        finally { setLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-zinc-900 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between border-b p-6 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {menuItem ? "Edit Menu Item" : "Add Menu Item"}
                    </h3>
                    <button onClick={onClose} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="h-5 w-5 text-zinc-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Restaurant *</label>
                        <select value={form.restaurantId} onChange={e => set("restaurantId", e.target.value)} required
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                            <option value="">Select restaurant</option>
                            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
                            <input value={form.name} onChange={e => set("name", e.target.value)} required
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Price ($)</label>
                            <input type="number" step="0.01" min="0" value={form.price} onChange={e => set("price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                        <select value={form.category} onChange={e => set("category", e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                        <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Image URL</label>
                        <input value={form.image} onChange={e => set("image", e.target.value)} placeholder="https://..."
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <input type="checkbox" checked={form.inStock} onChange={e => set("inStock", e.target.checked)} className="rounded" />
                            In Stock
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <input type="checkbox" checked={form.customizable} onChange={e => set("customizable", e.target.checked)} className="rounded" />
                            Customizable
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                            {loading ? "Saving..." : menuItem ? "Save Changes" : "Add Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
