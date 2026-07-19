import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Animated, Easing } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Divider } from '@/components/ui/divider';
import MotoLoader from '../../components/MotoLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartItem } from '../../components/CartItem';
import { EmptyState } from '../../components/EmptyState';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag } from 'lucide-react-native';
import { router } from 'expo-router';
import { restaurantAPI } from '../../services/api';
import { Restaurant } from '../../types';

export default function CartScreen() {
    const { items, totalAmount, itemCount, restaurantId, isLoading } = useCart();
    const { isAuthenticated } = useAuth();
    const insets = useSafeAreaInsets();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

    const btnSlide = useRef(new Animated.Value(60)).current;
    const btnOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (items.length > 0) {
            Animated.parallel([
                Animated.timing(btnSlide, { toValue: 0, duration: 400, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(btnOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [items.length]);

    useEffect(() => {
        if (restaurantId) {
            restaurantAPI.getById(restaurantId).then(r => setRestaurant(r.data)).catch(() => {});
        } else {
            setRestaurant(null);
        }
    }, [restaurantId]);

    const serviceFee = parseFloat((totalAmount * 0.05).toFixed(2));
    const deliveryFee = restaurant?.deliveryFee ?? 0;
    const orderTotal = totalAmount + deliveryFee + serviceFee;

    if (isLoading) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <MotoLoader />
            </Box>
        );
    }

    if (items.length === 0) {
        return (
            <Box className="flex-1 bg-white">
                <Box className="bg-green-500 px-4 py-3" style={{ paddingTop: insets.top + 12 }}>
                    <Text className="text-white text-lg font-heading">Your Basket</Text>
                </Box>
                <EmptyState
                    icon={ShoppingBag}
                    title="Your basket is empty"
                    message="Add items from a restaurant to get started"
                    actionLabel="Find Restaurants"
                    onAction={() => router.push('/(tabs)')}
                />
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-gray-50">
            <Box className="bg-green-500 px-4 py-3" style={{ paddingTop: insets.top + 12 }}>
                <Text className="text-white text-lg font-heading">Your Basket</Text>
                {restaurant && <Text className="text-green-100 text-sm">{restaurant.name}</Text>}
            </Box>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <VStack className="gap-1 mb-4">
                    {items.map((item, i) => <CartItem key={item.menuItemId} item={item} index={i} />)}
                </VStack>

                <Box className="bg-white rounded-xl p-4">
                    <Heading className="text-base mb-3">Order Summary</Heading>
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
                        <Divider className="my-1" />
                        <HStack className="justify-between">
                            <Text className="font-heading text-base">Total</Text>
                            <Text className="font-heading text-base">${orderTotal.toFixed(2)}</Text>
                        </HStack>
                    </VStack>
                </Box>
            </ScrollView>

            <Animated.View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4"
                style={{ paddingTop: 16, paddingBottom: 16, transform: [{ translateY: btnSlide }], opacity: btnOpacity }}
            >
                    {isAuthenticated ? (
                        <Button
                            className="bg-green-500 rounded-xl"
                            onPress={() => router.push('/checkout')}
                            size="lg"
                        >
                            <ButtonText className="text-white font-heading">
                                Go to Checkout • ${orderTotal.toFixed(2)}
                            </ButtonText>
                        </Button>
                    ) : (
                        <Button
                            className="bg-green-500 rounded-xl"
                            onPress={() => router.push('/(auth)/login?redirect=checkout')}
                            size="lg"
                        >
                            <ButtonText className="text-white font-heading">Sign In to Checkout</ButtonText>
                        </Button>
                    )}
            </Animated.View>
        </Box>
    );
}
