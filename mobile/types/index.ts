export interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
}

export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
    phone: string | null;
    addresses: Address[];
    firebaseUserId?: string;
}

export interface Restaurant {
    id: string;
    name: string;
    image: string;
    cuisineType: string;
    cuisineIcon: string;
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

export interface CartItem {
    menuItemId: string;
    quantity: number;
    customizations?: string[];
    price: number;
    menuItem?: MenuItem;
}

export interface Cart {
    id: string;
    userId: string;
    restaurantId: string;
    items: CartItem[];
    totalAmount: number;
}

export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    restaurantId: string;
    restaurantName: string;
    restaurantLocation: { latitude: number; longitude: number };
    items: OrderItem[];
    deliveryAddress: { street: string; city: string; latitude: number; longitude: number };
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    driverTip: number;
    totalAmount: number;
    status: 'pending' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
    statusHistory: { status: string; date: string }[];
    paymentStatus: 'pending' | 'paid' | 'failed';
    createdAt: string;
    driverLocation?: { latitude: number; longitude: number };
}

export interface Banner {
    id: string;
    image: string;
    title: string;
    link: string;
}

export interface Category {
    id: string;
    name: string;
    image: string;
    order: number;
}

export interface Review {
    id: string;
    restaurantId: string;
    orderId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt?: string;
}

export interface Wishlist {
    id: string;
    userId: string;
    restaurantIds: string[];
}

export interface ProductFilter {
    query?: string;
    cuisineType?: string;
    minRating?: number;
    maxDeliveryFee?: number;
    sortOrder?: 'rating_desc' | 'delivery_time_asc' | 'delivery_fee_asc';
}
