"use client";

import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { Restaurant } from "@/lib/api";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Restaurant, "id"> | Restaurant) => Promise<void>;
    restaurant: Restaurant | null;
}

const EMPTY: Omit<Restaurant, "id"> = {
    name: "",
    image: "",
    cuisineType: "",
    address: "",
    latitude: 0,
    longitude: 0,
    rating: 0,
    ratingCount: 0,
    deliveryTimeEst: 25,
    deliveryFee: 1.99,
    isActive: true,
    createdAt: "",
};

export function RestaurantDialog({ isOpen, onClose, onSave, restaurant }: Props) {
    const [form, setForm] = useState<Omit<Restaurant, "id">>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (restaurant) {
            const { id, ...rest } = restaurant;
            setForm(rest);
        } else {
            setForm(EMPTY);
        }
        setError("");
    }, [restaurant, isOpen]);

    const set = (key: keyof typeof EMPTY, value: any) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError("Name is required"); return; }
        setLoading(true);
        try {
            const data = { ...form, createdAt: form.createdAt || new Date().toISOString() };
            if (restaurant) await onSave({ id: restaurant.id, ...data });
            else await onSave(data);
            onClose();
        } catch { setError("Failed to save restaurant"); }
        finally { setLoading(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-zinc-900 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between border-b p-6 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {restaurant ? "Edit Restaurant" : "Add Restaurant"}
                    </h3>
                    <button onClick={onClose} className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="h-5 w-5 text-zinc-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
                            <input value={form.name} onChange={e => set("name", e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cuisine Type</label>
                            <input value={form.cuisineType} onChange={e => set("cuisineType", e.target.value)}
                                placeholder="e.g. Pizza, Sushi, Burgers"
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Image URL</label>
                        <input value={form.image} onChange={e => set("image", e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Address</label>
                        <input value={form.address} onChange={e => set("address", e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                <MapPin className="inline h-3.5 w-3.5 mr-1" />Latitude
                            </label>
                            <input type="number" step="any" value={form.latitude} onChange={e => set("latitude", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                <MapPin className="inline h-3.5 w-3.5 mr-1" />Longitude
                            </label>
                            <input type="number" step="any" value={form.longitude} onChange={e => set("longitude", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Delivery Time (min)</label>
                            <input type="number" value={form.deliveryTimeEst} onChange={e => set("deliveryTimeEst", parseInt(e.target.value) || 0)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Delivery Fee ($)</label>
                            <input type="number" step="0.01" value={form.deliveryFee} onChange={e => set("deliveryFee", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rating</label>
                            <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => set("rating", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set("isActive", e.target.checked)}
                            className="rounded border-zinc-300" />
                        <label htmlFor="isActive" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active (visible to users)</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                            {loading ? "Saving..." : restaurant ? "Save Changes" : "Create Restaurant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
