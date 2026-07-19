import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Minus, Plus } from 'lucide-react-native';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';

export const CartItem = ({ item, index = 0 }: { item: CartItemType; index?: number }) => {
    const { updateQuantity, removeFromCart } = useCart();
    const { menuItem, quantity, menuItemId } = item;

    const slideY = useRef(new Animated.Value(30)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const qtyScale = useRef(new Animated.Value(1)).current;
    const prevQty = useRef(quantity);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(slideY, { toValue: 0, duration: 320, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    if (prevQty.current !== quantity) {
        prevQty.current = quantity;
        Animated.sequence([
            Animated.timing(qtyScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
            Animated.spring(qtyScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
        ]).start();
    }

    if (!menuItem) return null;

    return (
        <Animated.View style={{ opacity, transform: [{ translateY: slideY }] }}>
            <Box className="bg-white p-4 mb-2 rounded-xl">
                <HStack className="gap-3">
                    <Image
                        source={{ uri: menuItem.image }}
                        alt={menuItem.name}
                        className="h-32 w-32 rounded-lg"
                        resizeMode="cover"
                    />
                    <VStack className="flex-1 justify-between">
                        <Text className="text-sm font-heading" numberOfLines={2}>{menuItem.name}</Text>
                        <Text className="font-heading text-base">${(menuItem.price * quantity).toFixed(2)}</Text>
                        <HStack className="justify-between items-center mt-1">
                            <HStack className="items-center bg-gray-100 rounded-lg">
                                <Pressable className="p-2" onPress={() => updateQuantity(menuItemId, quantity - 1)}>
                                    <Icon as={Minus} style={{ width: 24, height: 24 }} />
                                </Pressable>
                                <Animated.View style={{ transform: [{ scale: qtyScale }] }}>
                                    <Text className="px-3 font-heading">{quantity}</Text>
                                </Animated.View>
                                <Pressable className="p-2" onPress={() => updateQuantity(menuItemId, quantity + 1)}>
                                    <Icon as={Plus} style={{ width: 24, height: 24 }} />
                                </Pressable>
                            </HStack>
                            <Button variant="link" size="sm" onPress={() => removeFromCart(menuItemId)}>
                                <ButtonText className="text-red-500">Remove</ButtonText>
                            </Button>
                        </HStack>
                    </VStack>
                </HStack>
            </Box>
        </Animated.View>
    );
};
