import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Star, Clock, DollarSign } from 'lucide-react-native';
import { Restaurant } from '../types';
import { router } from 'expo-router';

interface RestaurantCardProps {
    restaurant: Restaurant;
    distanceKm?: number;
    index?: number;
}

export const RestaurantCard = ({ restaurant, distanceKm, index = 0 }: RestaurantCardProps) => {
    const translateY = useRef(new Animated.Value(40)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 380,
                delay: index * 80,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 380,
                delay: index * 80,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
            <Pressable
                onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Box className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm">
                    <Image
                        source={{ uri: restaurant.image }}
                        alt={restaurant.name}
                        className="w-full h-56"
                        resizeMode="cover"
                    />
                    <VStack className="p-3 gap-1">
                        <Text className="font-heading text-base">{restaurant.name}</Text>
                        <HStack className="gap-3 items-center">
                            <HStack className="items-center gap-1">
                                <Icon as={Star} className="text-yellow-400 fill-yellow-400" style={{ width: 14, height: 14 }} />
                                <Text className="text-xs text-gray-600">{restaurant.rating.toFixed(1)}</Text>
                            </HStack>
                            <HStack className="items-center gap-1">
                                <Icon as={Clock} className="text-gray-400" style={{ width: 14, height: 14 }} />
                                <Text className="text-xs text-gray-600">{restaurant.deliveryTimeEst} min</Text>
                            </HStack>
                            <HStack className="items-center gap-1">
                                <Icon as={DollarSign} className="text-gray-400" style={{ width: 14, height: 14 }} />
                                <Text className="text-xs text-gray-600">${restaurant.deliveryFee.toFixed(2)} delivery</Text>
                            </HStack>
                            {distanceKm !== undefined && (
                                <Text className="text-xs text-gray-400">{distanceKm.toFixed(1)} km</Text>
                            )}
                        </HStack>
                        <Text className="text-xs text-gray-400">{restaurant.cuisineType}</Text>
                    </VStack>
                </Box>
            </Pressable>
        </Animated.View>
    );
};
