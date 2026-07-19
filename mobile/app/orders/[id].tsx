import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import MotoLoader from '../../components/MotoLoader';
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, MapPin, Star } from 'lucide-react-native';
import { Icon } from "@/components/ui/icon";
import { OrderTrackingMap } from '../../components/OrderTrackingMap';
import { AddReviewModal } from '../../components/AddReviewModal';
import { orderAPI, reviewAPI } from '../../services/api';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Order Received',
    preparing: 'Restaurant is Preparing',
    ready_for_pickup: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready_for_pickup: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        orderAPI.getById(id).then(r => {
            setOrder(r.data);
            // Check if user already reviewed this order
            if (r.data.status === 'delivered') {
                reviewAPI.getByOrder(id).then(rev => {
                    setHasReviewed(rev.data.length > 0);
                }).catch(console.error);
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!order || !user) return;
        setIsSubmittingReview(true);
        try {
            await reviewAPI.create({
                restaurantId: order.restaurantId,
                orderId: order.id,
                userId: user.id,
                userName: user.name,
                rating,
                comment,
            });
            setHasReviewed(true);
            setShowReviewModal(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <MotoLoader />
            </Box>
        );
    }

    if (!order) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <Text>Order not found</Text>
            </Box>
        );
    }

    const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700';
    const statusLabel = STATUS_LABELS[order.status] || order.status;

    const showMap = ['out_for_delivery', 'preparing', 'ready_for_pickup'].includes(order.status);

    return (
        <Box className="flex-1 bg-gray-50">
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <HStack className="px-4 py-3 items-center gap-3">
                        <Pressable onPress={() => router.back()}>
                            <ChevronLeft color="white" size={24} />
                        </Pressable>
                        <Text className="text-white text-lg font-heading">Order #{order.orderNumber}</Text>
                    </HStack>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
                {/* Status */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <HStack className="justify-between items-center mb-1">
                        <Text className="text-gray-500 text-sm">Order Status</Text>
                        <Box className={`px-3 py-1 rounded-full ${statusColor.split(' ')[0]}`}>
                            <Text className={`text-xs font-heading ${statusColor.split(' ')[1]}`}>{statusLabel}</Text>
                        </Box>
                    </HStack>
                    <Text className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleString()}</Text>
                </Box>

                {/* Tracking Map */}
                {showMap && (
                    <Box className="mb-3">
                        <OrderTrackingMap
                            restaurantCoords={order.restaurantLocation}
                            userCoords={order.deliveryAddress}
                            orderStatus={order.status}
                            totalMinutes={15}
                        />
                    </Box>
                )}

                {/* Restaurant & Delivery */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <VStack className="gap-3">
                        <HStack className="items-center gap-2">
                            <MapPin size={16} color="#06C167" />
                            <VStack>
                                <Text className="font-heading">{order.restaurantName}</Text>
                                <Text className="text-gray-400 text-xs">Pickup location</Text>
                            </VStack>
                        </HStack>
                        <Divider />
                        <HStack className="items-center gap-2">
                            <MapPin size={16} color="#3B82F6" />
                            <VStack>
                                <Text className="font-heading">{order.deliveryAddress.street}</Text>
                                <Text className="text-gray-400 text-xs">Your delivery address</Text>
                            </VStack>
                        </HStack>
                    </VStack>
                </Box>

                {/* Items */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <Heading className="text-base mb-3">Items</Heading>
                    <VStack className="gap-2">
                        {order.items.map((item, i) => (
                            <HStack key={i} className="justify-between">
                                <Text className="text-gray-700">{item.quantity}x {item.name}</Text>
                                <Text className="font-heading">${(item.price * item.quantity).toFixed(2)}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </Box>

                {/* Payment breakdown */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <Heading className="text-base mb-3">Payment</Heading>
                    <VStack className="gap-2">
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Subtotal</Text>
                            <Text>${order.subtotal?.toFixed(2) ?? '-'}</Text>
                        </HStack>
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Delivery Fee</Text>
                            <Text>${order.deliveryFee?.toFixed(2) ?? '-'}</Text>
                        </HStack>
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Service Fee</Text>
                            <Text>${order.serviceFee?.toFixed(2) ?? '-'}</Text>
                        </HStack>
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Driver Tip</Text>
                            <Text>${order.driverTip?.toFixed(2) ?? '-'}</Text>
                        </HStack>
                        <Divider className="my-1" />
                        <HStack className="justify-between">
                            <Text className="font-heading">Total</Text>
                            <Text className="font-heading">${order.totalAmount.toFixed(2)}</Text>
                        </HStack>
                    </VStack>
                </Box>

                {/* Review prompt for delivered orders */}
                {order.status === 'delivered' && (
                    <Box className="bg-white rounded-xl p-4 mb-3">
                        {hasReviewed ? (
                            <HStack className="items-center gap-2">
                                <Icon as={Star} className="text-yellow-400 fill-yellow-400" style={{ width: 18, height: 18 }} />
                                <Text className="text-gray-700 font-heading">Thanks for your review!</Text>
                            </HStack>
                        ) : (
                            <VStack className="gap-2">
                                <Text className="font-heading text-gray-800">How was your order?</Text>
                                <Text className="text-gray-500 text-sm">Share your experience with {order.restaurantName}</Text>
                                <Button
                                    className="bg-yellow-400 rounded-xl mt-1"
                                    onPress={() => setShowReviewModal(true)}
                                >
                                    <ButtonText className="text-black font-heading">Write a Review</ButtonText>
                                </Button>
                            </VStack>
                        )}
                    </Box>
                )}

                <Button
                    className="bg-green-500 rounded-xl mt-2"
                    onPress={() => router.replace('/(tabs)/profile')}
                >
                    <ButtonText className="text-white font-heading"  numberOfLines={1}>Track Order</ButtonText>
                </Button>
            </ScrollView>

            <AddReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={handleSubmitReview}
                isSubmitting={isSubmittingReview}
            />
        </Box>
    );
}
