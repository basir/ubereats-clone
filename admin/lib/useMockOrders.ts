import { useEffect, useRef } from "react";
import { MOCK_DATA, MOCK_ORDER_CREATE_FREQ } from "./mockConfig";
import { MOCK_RESTAURANTS, MOCK_MENU_ITEMS, MOCK_USERS } from "./mockData";
import type { Order } from "./api";

let orderCounter = 1000;

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockOrder(): Order {
  const restaurant = rand(MOCK_RESTAURANTS);
  const user = rand(MOCK_USERS);
  const address = rand(user.addresses);

  const restaurantItems = MOCK_MENU_ITEMS.filter(
    (m) => m.restaurantId === restaurant.id
  );
  const count = Math.floor(Math.random() * 3) + 1;
  const pickedItems: typeof restaurantItems = [];
  for (let i = 0; i < count; i++) {
    pickedItems.push(rand(restaurantItems));
  }

  const items = pickedItems.map((item) => ({
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    quantity: Math.floor(Math.random() * 2) + 1,
  }));

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = restaurant.deliveryFee;
  const serviceFee = parseFloat((subtotal * 0.05).toFixed(2));
  const driverTip = parseFloat((Math.random() * 4 + 1).toFixed(2));
  const totalAmount = parseFloat(
    (subtotal + deliveryFee + serviceFee + driverTip).toFixed(2)
  );

  const now = new Date().toISOString();
  const id = `mock-${++orderCounter}`;

  return {
    id,
    orderNumber: `UE-LIVE-${orderCounter}`,
    userId: user.id,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantLocation: {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    },
    items,
    deliveryAddress: {
      street: address.street,
      city: address.city,
      latitude: address.latitude,
      longitude: address.longitude,
    },
    subtotal,
    deliveryFee,
    serviceFee,
    driverTip,
    totalAmount,
    status: "pending",
    statusHistory: [{ status: "pending", date: now }],
    paymentStatus: "paid",
    createdAt: now,
  } as Order & { deliveryAddress: { latitude: number; longitude: number; street: string; city: string } };
}

export function useMockOrders(onNewOrder: (order: Order) => void) {
  const callbackRef = useRef(onNewOrder);
  callbackRef.current = onNewOrder;

  useEffect(() => {
    if (!MOCK_DATA) return;
    const interval = setInterval(() => {
      callbackRef.current(generateMockOrder());
    }, MOCK_ORDER_CREATE_FREQ * 1000);
    return () => clearInterval(interval);
  }, []);
}
