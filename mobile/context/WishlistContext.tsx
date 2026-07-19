import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';

interface WishlistContextType {
    wishlist: string[];
    isInWishlist: (restaurantId: string) => boolean;
    toggleWishlist: (restaurantId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [wishlistId, setWishlistId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchWishlist();
        else { setWishlist([]); setWishlistId(null); }
    }, [user]);

    const fetchWishlist = async () => {
        if (!user) return;
        try {
            const res = await wishlistAPI.getByUser(user.id);
            const lists = res.data;
            if (lists.length > 0) {
                setWishlist(lists[0].restaurantIds || []);
                setWishlistId(lists[0].id);
            } else {
                const created = await wishlistAPI.create({ userId: user.id, restaurantIds: [] });
                setWishlistId(created.data.id);
            }
        } catch (e) { console.error('Error fetching wishlist:', e); }
    };

    const toggleWishlist = async (restaurantId: string) => {
        if (!user || !wishlistId) return;
        const updated = wishlist.includes(restaurantId)
            ? wishlist.filter(id => id !== restaurantId)
            : [...wishlist, restaurantId];
        setWishlist(updated);
        try {
            await wishlistAPI.update(wishlistId, { restaurantIds: updated });
        } catch {
            setWishlist(wishlist);
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, isInWishlist: id => wishlist.includes(id), toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
    return ctx;
};
