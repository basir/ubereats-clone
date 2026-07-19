import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, MenuItem } from '../types';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CART_STORAGE_KEY = '@cart_items';
const CART_RESTAURANT_KEY = '@cart_restaurant';

interface CartContextType {
    items: CartItem[];
    restaurantId: string | null;
    totalAmount: number;
    itemCount: number;
    addToCart: (menuItem: MenuItem, quantity?: number) => Promise<{ requiresClear: boolean; commit?: () => Promise<void> }>;
    removeFromCart: (menuItemId: string) => Promise<void>;
    updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [cartId, setCartId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Refs so callbacks always read current state without stale closures
    const itemsRef = React.useRef<CartItem[]>([]);
    const restaurantIdRef = React.useRef<string | null>(null);
    useEffect(() => { itemsRef.current = items; }, [items]);
    useEffect(() => { restaurantIdRef.current = restaurantId; }, [restaurantId]);

    useEffect(() => {
        if (user) fetchCart();
        else loadLocalCart();
    }, [user]);

    const loadLocalCart = async () => {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        const storedRestaurant = await AsyncStorage.getItem(CART_RESTAURANT_KEY);
        setItems(stored ? JSON.parse(stored) : []);
        setRestaurantId(storedRestaurant);
        setCartId(null);
    };

    const saveLocalCart = async (cartItems: CartItem[], rid: string | null) => {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        if (rid) await AsyncStorage.setItem(CART_RESTAURANT_KEY, rid);
        else await AsyncStorage.removeItem(CART_RESTAURANT_KEY);
    };

    const fetchCart = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await cartAPI.getCart(user.id);
            const carts = res.data;
            if (carts.length > 0) {
                const cart = carts[0];
                setItems(cart.items || []);
                setRestaurantId(cart.restaurantId || null);
                setCartId(cart.id);
            } else {
                const newCart = { userId: user.id, restaurantId: '', items: [], totalAmount: 0 };
                const created = await cartAPI.create(newCart as any);
                setCartId(created.data.id);
            }
        } catch (e) {
            console.error('Error fetching cart:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const syncCart = async (newItems: CartItem[], rid: string | null) => {
        if (!user) {
            await saveLocalCart(newItems, rid);
            return;
        }
        if (!cartId) return;
        const total = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
        await cartAPI.update(cartId, { items: newItems, totalAmount: total, restaurantId: rid || '' } as any);
    };

    const addToCart = async (menuItem: MenuItem, quantity = 1): Promise<{ requiresClear: boolean; commit?: () => Promise<void> }> => {
        const currentItems = itemsRef.current;
        const currentRestaurantId = restaurantIdRef.current;

        console.log('[addToCart] menuItem:', menuItem.name, 'restaurantId:', menuItem.restaurantId);
        console.log('[addToCart] currentItems.length:', currentItems.length, 'currentRestaurantId:', currentRestaurantId);

        // Different restaurant check
        if (currentRestaurantId && currentRestaurantId !== menuItem.restaurantId && currentItems.length > 0) {
            console.log('[addToCart] requiresClear');
            return { requiresClear: true };
        }

        const newRestaurantId = menuItem.restaurantId;
        const existing = currentItems.findIndex(i => i.menuItemId === menuItem.id);
        let newItems = [...currentItems];
        if (existing >= 0) {
            newItems[existing] = { ...newItems[existing], quantity: newItems[existing].quantity + quantity };
        } else {
            newItems.push({ menuItemId: menuItem.id, quantity, price: menuItem.price, menuItem });
        }

        console.log('[addToCart] newItems.length:', newItems.length, 'firing syncCart');
        // Fire the API in the background immediately; caller commits UI state when ready
        const syncPromise = syncCart(newItems, newRestaurantId);

        const commit = async () => {
            console.log('[addToCart] commit() called — updating state');
            itemsRef.current = newItems;
            restaurantIdRef.current = newRestaurantId;
            setItems(newItems);
            setRestaurantId(newRestaurantId);
            await syncPromise;
            console.log('[addToCart] commit() done');
        };

        return { requiresClear: false, commit };
    };

    const removeFromCart = async (menuItemId: string) => {
        const newItems = items.filter(i => i.menuItemId !== menuItemId);
        const newRid = newItems.length > 0 ? restaurantId : null;
        setItems(newItems);
        setRestaurantId(newRid);
        await syncCart(newItems, newRid);
    };

    const updateQuantity = async (menuItemId: string, quantity: number) => {
        if (quantity <= 0) { await removeFromCart(menuItemId); return; }
        const newItems = items.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i);
        setItems(newItems);
        await syncCart(newItems, restaurantId);
    };

    const clearCart = async () => {
        itemsRef.current = [];
        restaurantIdRef.current = null;
        setItems([]);
        setRestaurantId(null);
        await syncCart([], null);
    };

    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, restaurantId, totalAmount, itemCount,
            addToCart, removeFromCart, updateQuantity, clearCart, isLoading
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within a CartProvider');
    return ctx;
};
