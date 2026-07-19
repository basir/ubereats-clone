import React, { useState, useEffect } from 'react';
import { ScrollView, Platform } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Divider } from '@/components/ui/divider';
import { Pressable } from '@/components/ui/pressable';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';
import { useStripe } from "@/utils/stripe";
import { orderAPI, restaurantAPI } from '@/services/api';
import { router } from 'expo-router';
import { showAlert } from '@/utils';
import { calculateDeliveryFee } from '@/utils/location';
import { Restaurant } from '@/types';
import { MapPin, ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';

const isWeb = Platform.OS === 'web';

const TIP_OPTIONS = [0, 2, 3, 5];

export default function CheckoutScreen() {
    const { items, totalAmount, restaurantId, clearCart } = useCart();
    const { user } = useAuth();
    const { deliveryLocation } = useLocation();
    const stripe = useStripe();
    const insets = useSafeAreaInsets();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [selectedTip, setSelectedTip] = useState(2);
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (restaurantId) {
            restaurantAPI.getById(restaurantId).then(r => setRestaurant(r.data)).catch(() => {});
        }
    }, [restaurantId]);

    const deliveryFee = restaurant?.deliveryFee ?? 0;
    const serviceFee = parseFloat((totalAmount * 0.05).toFixed(2));
    const orderTotal = totalAmount + deliveryFee + serviceFee + selectedTip;

    const initPayment = async () => {
        try {
            const functions = getFunctions(app);
            const createIntent = httpsCallable(functions, 'createPaymentIntent');
            const res = await createIntent({ amount: orderTotal, currency: 'usd' });
            const { clientSecret: secret } = res.data as any;
            if (!isWeb) {
                await stripe.initPaymentSheet({
                    paymentIntentClientSecret: secret,
                    merchantDisplayName: 'Uber Eats Clone',
                    customFlow: false,
                });
            }
            setClientSecret(secret);
        } catch (e) {
            console.error('Payment init error:', e);
        }
    };

    useEffect(() => {
        if (orderTotal > 0) initPayment();
    }, [orderTotal]);

    const handlePlaceOrder = async () => {
        if (!user || !restaurant || !deliveryLocation) {
            showAlert('Please set a delivery location to continue.');
            return;
        }
        setLoading(true);
        try {
            if (isWeb) {
                // Web Stripe payment handled via Elements - skip for now if no clientSecret
                if (!clientSecret) { showAlert('Payment not initialized'); setLoading(false); return; }
            } else {
                const { error } = await stripe.presentPaymentSheet();
                if (error) { showAlert(`${error.code}: ${error.message}`); setLoading(false); return; }
            }

            const orderData = {
                orderNumber: `UE-${Date.now()}`,
                userId: user.id,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                restaurantLocation: { latitude: restaurant.latitude, longitude: restaurant.longitude },
                items: items.map(i => ({
                    menuItemId: i.menuItemId,
                    name: i.menuItem?.name || '',
                    price: i.price,
                    quantity: i.quantity,
                    image: i.menuItem?.image,
                })),
                deliveryAddress: {
                    street: deliveryLocation.address,
                    city: '',
                    latitude: deliveryLocation.latitude,
                    longitude: deliveryLocation.longitude,
                },
                subtotal: totalAmount,
                deliveryFee,
                serviceFee,
                driverTip: selectedTip,
                totalAmount: orderTotal,
                status: 'pending' as const,
                statusHistory: [{ status: 'pending', date: new Date().toISOString() }],
                paymentStatus: 'paid' as const,
                createdAt: new Date().toISOString(),
            };

            const result = await orderAPI.create(orderData);
            await clearCart();
            // showAlert('Order placed successfully!');
            router.replace(`/orders/${result.data.id}`);
        } catch (e) {
            console.error('Order error:', e);
            showAlert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="flex-1 bg-gray-50">
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <Box className="px-4 py-3">
                        <HStack className="items-center gap-3">
                            <Pressable onPress={() => router.back()}>
                                <ChevronLeft color="white" size={24} />
                            </Pressable>
                            <Text className="text-white text-lg font-heading">Checkout</Text>
                        </HStack>
                    </Box>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {/* Delivery Address */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <Heading className="text-base mb-2">Deliver to</Heading>
                    <HStack className="items-start gap-2">
                        <MapPin size={18} color="#06C167" style={{ marginTop: 2 }} />
                        <Text className="flex-1 text-gray-700">
                            {deliveryLocation?.address || 'No delivery address set. Go back and set one.'}
                        </Text>
                    </HStack>
                </Box>

                {/* Items */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <Heading className="text-base mb-3">Your Order</Heading>
                    <VStack className="gap-2">
                        {items.map(item => (
                            <HStack key={item.menuItemId} className="justify-between">
                                <Text className="text-gray-700">{item.quantity}x {item.menuItem?.name}</Text>
                                <Text className="font-heading">${(item.price * item.quantity).toFixed(2)}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </Box>

                {/* Tip */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <Heading className="text-base mb-3">Add a tip</Heading>
                    <HStack className="gap-2">
                        {TIP_OPTIONS.map(tip => (
                            <Pressable
                                key={tip}
                                onPress={() => setSelectedTip(tip)}
                                className="flex-1"
                            >
                                <Box className={`py-2 rounded-lg items-center border ${selectedTip === tip ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'}`}>
                                    <Text className={`font-heading text-sm ${selectedTip === tip ? 'text-white' : 'text-gray-700'}`}>
                                        {tip === 0 ? 'None' : `$${tip}`}
                                    </Text>
                                </Box>
                            </Pressable>
                        ))}
                    </HStack>
                </Box>

                {/* Summary */}
                <Box className="bg-white rounded-xl p-4 mb-3">
                    <Heading className="text-base mb-3">Payment Summary</Heading>
                    <VStack className="gap-2">
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Subtotal</Text>
                            <Text>${totalAmount.toFixed(2)}</Text>
                        </HStack>
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Delivery Fee</Text>
                            <Text>${deliveryFee.toFixed(2)}</Text>
                        </HStack>
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Service Fee</Text>
                            <Text>${serviceFee.toFixed(2)}</Text>
                        </HStack>
                        <HStack className="justify-between">
                            <Text className="text-gray-600">Driver Tip</Text>
                            <Text>${selectedTip.toFixed(2)}</Text>
                        </HStack>
                        <Divider className="my-1" />
                        <HStack className="justify-between">
                            <Text className="font-heading text-base">Total</Text>
                            <Text className="font-heading text-base">${orderTotal.toFixed(2)}</Text>
                        </HStack>
                    </VStack>
                    {/* Web payment handled by Stripe Payment Sheet */}
                </Box>
            </ScrollView>

            <Box className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4" style={{ paddingBottom: insets.bottom + 16 }}>
                <Button
                    className="bg-green-500 rounded-xl"
                    size="lg"
                    onPress={handlePlaceOrder}
                    isDisabled={loading || !deliveryLocation}
                >
                    <ButtonText className="text-white font-heading">
                        {loading ? 'Placing Order...' : `Place Order • $${orderTotal.toFixed(2)}`}
                    </ButtonText>
                </Button>
            </Box>
        </Box>
    );
}
