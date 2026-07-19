import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import MotoLoader from '../../components/MotoLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { orderAPI } from '../../services/api';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready_for_pickup: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersScreen() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        if (!user) { setLoading(false); return; }
        try {
            const res = await orderAPI.getByUser(user.id);
            setOrders(res.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchOrders(); }, [user]);

    const header = (
        <View style={{ backgroundColor: '#06C167' }}>
            <SafeAreaView edges={['top']}>
                <Box className="px-4 py-3">
                    <Text className="text-white text-lg font-heading">Your Orders</Text>
                </Box>
            </SafeAreaView>
        </View>
    );

    if (loading) return (
        <Box className="flex-1 bg-white">
            {header}
            <Box className="flex-1 justify-center items-center">
                <MotoLoader />
            </Box>
        </Box>
    );

    if (orders.length === 0) return (
        <Box className="flex-1 bg-white">
            {header}
            <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                message="Your past orders will appear here."
                actionLabel="Find Restaurants"
                onAction={() => router.push('/(tabs)')}
            />
        </Box>
    );

    return (
        <Box className="flex-1 bg-gray-50">
            {header}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#06C167" />}
                contentContainerStyle={{ padding: 16 }}
            >
                {orders.map(order => {
                    const colorClass = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700';
                    return (
                        <Pressable key={order.id} onPress={() => router.push(`/orders/${order.id}`)}>
                            <Box className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                                <HStack className="justify-between items-start mb-2">
                                    <VStack>
                                        <Text className="font-heading text-base">{order.restaurantName}</Text>
                                        <Text className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</Text>
                                    </VStack>
                                    <Box className={`px-2 py-1 rounded-full ${colorClass.split(' ')[0]}`}>
                                        <Text className={`text-xs font-heading ${colorClass.split(' ')[1]}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </Text>
                                    </Box>
                                </HStack>
                                <Text className="text-gray-600 text-sm mb-1">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </Text>
                                <HStack className="justify-between items-center mt-1">
                                    <Text className="text-gray-400 text-xs">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</Text>
                                    <Text className="font-heading text-base">${order.totalAmount.toFixed(2)}</Text>
                                </HStack>
                            </Box>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </Box>
    );
}
