import { db } from "./firebase";
import {
    collection, getDocs, getDoc, doc, query, where,
    addDoc, updateDoc, deleteDoc, orderBy,
} from "firebase/firestore";

export interface Restaurant {
    id: string;
    name: string;
    image: string;
    cuisineType: string;
    cuisineImage: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number;
    ratingCount: number;
    deliveryTimeEst: number;
    deliveryFee: number;
    isActive: boolean;
    createdAt: string;
}

export interface MenuItem {
    id: string;
    restaurantId: string;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    inStock: boolean;
    customizable: boolean;
    options?: { name: string; price: number }[];
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    restaurantId: string;
    restaurantName: string;
    restaurantLocation: { latitude: number; longitude: number };
    items: { menuItemId: string; name: string; price: number; quantity: number }[];
    deliveryAddress: { street: string; city: string; latitude: number; longitude: number };
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    driverTip: number;
    totalAmount: number;
    status: string;
    statusHistory: { status: string; date: string }[];
    paymentStatus: string;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    vehicle?: string;
    rating?: number;
    ratingCount?: number;
    isOnline?: boolean;
    earnings?: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        allTime: number;
    };
    createdAt: string;
    firebaseUserId?: string;
}

export const api = {
    // Dashboard stats
    getStats: async () => {
        const [restSnap, orderSnap, userSnap, menuSnap] = await Promise.all([
            getDocs(collection(db, "restaurants")),
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "menuItems")),
        ]);
        const totalRevenue = orderSnap.docs.reduce((acc, d) => acc + (d.data().totalAmount || 0), 0);
        return {
            totalRevenue,
            totalOrders: orderSnap.size,
            totalRestaurants: restSnap.size,
            totalMenuItems: menuSnap.size,
            totalUsers: userSnap.size,
        };
    },

    // Monthly revenue
    getMonthlyRevenue: async () => {
        const snap = await getDocs(collection(db, "orders"));
        const year = new Date().getFullYear();
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const data = months.map((name, i) => ({ name, total: 0, month: i }));
        snap.docs.forEach(d => {
            const orderData = d.data();
            if (orderData.createdAt) {
                const date = new Date(orderData.createdAt);
                if (date.getFullYear() === year) {
                    data[date.getMonth()].total += orderData.totalAmount || 0;
                }
            }
        });
        return data.map(({ name, total }) => ({ name, total }));
    },

    // Restaurants
    getRestaurants: async () => {
        const snap = await getDocs(collection(db, "restaurants"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Restaurant[];
    },
    getRestaurant: async (id: string) => {
        const snap = await getDoc(doc(db, "restaurants", id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Restaurant;
        return null;
    },
    createRestaurant: async (data: Omit<Restaurant, "id">) => {
        const ref = await addDoc(collection(db, "restaurants"), { ...data, createdAt: new Date().toISOString() });
        return { id: ref.id, ...data };
    },
    updateRestaurant: async (id: string, data: Partial<Restaurant>) => {
        await updateDoc(doc(db, "restaurants", id), data as any);
        return { id, ...data };
    },
    deleteRestaurant: async (id: string) => {
        await deleteDoc(doc(db, "restaurants", id));
    },

    // Menu Items
    getMenuItems: async (restaurantId?: string) => {
        let q: any = collection(db, "menuItems");
        if (restaurantId) q = query(q, where("restaurantId", "==", restaurantId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) })) as MenuItem[];
    },
    createMenuItem: async (data: Omit<MenuItem, "id">) => {
        const ref = await addDoc(collection(db, "menuItems"), data);
        return { id: ref.id, ...data };
    },
    updateMenuItem: async (id: string, data: Partial<MenuItem>) => {
        await updateDoc(doc(db, "menuItems", id), data as any);
        return { id, ...data };
    },
    deleteMenuItem: async (id: string) => {
        await deleteDoc(doc(db, "menuItems", id));
    },

    // Orders
    getOrders: async () => {
        const snap = await getDocs(collection(db, "orders"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
    },
    getOrder: async (id: string) => {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Order;
        return null;
    },
    updateOrderStatus: async (id: string, status: string) => {
        const statusEntry = { status, date: new Date().toISOString() };
        const orderRef = doc(db, "orders", id);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
            const existing = snap.data().statusHistory || [];
            await updateDoc(orderRef, { status, statusHistory: [...existing, statusEntry] });
        }
    },

    // Users
    getUsers: async () => {
        const snap = await getDocs(collection(db, "users"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
    },
    getUserProfile: async (firebaseUserId: string) => {
        const q = query(collection(db, "users"), where("firebaseUserId", "==", firebaseUserId));
        const snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        return null;
    },
    updateUser: async (id: string, data: Partial<User>) => {
        await updateDoc(doc(db, "users", id), data as any);
    },
    deleteUser: async (id: string) => {
        await deleteDoc(doc(db, "users", id));
    },

    // Driver
    getDriverOrders: async (driverUid: string) => {
        const q = query(collection(db, "orders"), where("driverUid", "==", driverUid));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
    },
    getAvailableOrders: async () => {
        const q = query(collection(db, "orders"), where("status", "==", "ready_for_pickup"));
        const snap = await getDocs(q);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }) as Order)
            .filter((o: any) => !o.driverUid);
    },
    assignOrderToDriver: async (orderId: string, driverUid: string) => {
        const orderRef = doc(db, "orders", orderId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
            const statusEntry = { status: "out_for_delivery", date: new Date().toISOString() };
            const existing = snap.data().statusHistory || [];
            await updateDoc(orderRef, {
                driverUid,
                status: "out_for_delivery",
                statusHistory: [...existing, statusEntry],
            });
        }
    },
    getDriverProfile: async (firebaseUserId: string) => {
        const q = query(collection(db, "users"), where("firebaseUserId", "==", firebaseUserId));
        const snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        return null;
    },
};
