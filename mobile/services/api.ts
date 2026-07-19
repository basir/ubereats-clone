import { db } from '../firebaseConfig';
import {
    collection, getDocs, getDoc, doc, query, where,
    addDoc, updateDoc, setDoc, orderBy
} from 'firebase/firestore';
import { Restaurant, MenuItem, Cart, Order, Banner, Category, ProductFilter, Review, Wishlist } from '../types';

const response = <T>(data: T) => ({ data });

export const restaurantAPI = {
    getAll: async () => {
        const q = query(collection(db, 'restaurants'), where('isActive', '==', true));
        const snap = await getDocs(q);
        // console.log('[restaurantAPI.getAll] total docs:', snap.docs.length);
        // snap.docs.forEach(d => console.log('[restaurantAPI.getAll] doc:', d.id, JSON.stringify(d.data())));
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant)));
    },
    getById: async (id: string) => {
        const snap = await getDoc(doc(db, 'restaurants', id));
        if (snap.exists()) return response({ id: snap.id, ...snap.data() } as Restaurant);
        throw new Error('Restaurant not found');
    },
    getByCuisine: async (cuisineType: string) => {
        const q = query(collection(db, 'restaurants'),
            where('isActive', '==', true),
            where('cuisineType', '==', cuisineType));
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant)));
    },
};

export const menuItemAPI = {
    getByRestaurant: async (restaurantId: string) => {
        const q = query(collection(db, 'menuItems'), where('restaurantId', '==', restaurantId));
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
    },
    getById: async (id: string) => {
        const snap = await getDoc(doc(db, 'menuItems', id));
        if (snap.exists()) return response({ id: snap.id, ...snap.data() } as MenuItem);
        throw new Error('Menu item not found');
    },
};

export const bannerAPI = {
    getAll: async () => {
        const snap = await getDocs(collection(db, 'banners'));
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
    },
};

export const cuisineCategoryAPI = {
    getAll: async () => {
        const snap = await getDocs(collection(db, 'cuisineCategories'));
        const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        cats.sort((a, b) => a.order - b.order);
        return response(cats);
    },
};

export const cartAPI = {
    getCart: async (userId: string) => {
        const q = query(collection(db, 'carts'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cart)));
    },
    create: async (data: Omit<Cart, 'id'>) => {
        const ref = await addDoc(collection(db, 'carts'), data);
        return response({ id: ref.id, ...data });
    },
    update: async (id: string, data: Partial<Cart>) => {
        await updateDoc(doc(db, 'carts', id), data as any);
        return response(data);
    },
};

export const orderAPI = {
    create: async (orderData: Omit<Order, 'id'>) => {
        const ref = await addDoc(collection(db, 'orders'), orderData);
        return response({ id: ref.id, ...orderData });
    },
    getByUser: async (userId: string) => {
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    },
    getById: async (id: string) => {
        const snap = await getDoc(doc(db, 'orders', id));
        if (snap.exists()) return response({ id: snap.id, ...snap.data() } as Order);
        throw new Error('Order not found');
    },
    update: async (id: string, data: Partial<Order>) => {
        await updateDoc(doc(db, 'orders', id), data as any);
        return response(data);
    },
};

export const wishlistAPI = {
    getByUser: async (userId: string) => {
        const q = query(collection(db, 'wishlist'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Wishlist)));
    },
    create: async (data: Omit<Wishlist, 'id'>) => {
        const ref = await addDoc(collection(db, 'wishlist'), data);
        return response({ id: ref.id, ...data });
    },
    update: async (id: string, data: Partial<Wishlist>) => {
        await updateDoc(doc(db, 'wishlist', id), data as any);
        return response(data);
    },
};

export const reviewAPI = {
    getByRestaurant: async (restaurantId: string, limitCount = 5) => {
        const q = query(
            collection(db, 'reviews'),
            where('restaurantId', '==', restaurantId),
            orderBy('createdAt', 'desc'),
        );
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    },
    getByOrder: async (orderId: string) => {
        const q = query(collection(db, 'reviews'), where('orderId', '==', orderId));
        const snap = await getDocs(q);
        return response(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    },
    create: async (review: Omit<Review, 'id'>) => {
        const ref = await addDoc(collection(db, 'reviews'), { ...review, createdAt: new Date().toISOString() });
        return response({ id: ref.id, ...review, createdAt: new Date().toISOString() });
    },
};
