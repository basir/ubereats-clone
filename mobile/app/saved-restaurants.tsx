import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import MotoLoader from '@/components/MotoLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Heart, Star, Clock, Trash2 } from 'lucide-react-native';
import { useWishlist } from '@/context/WishlistContext';
import { restaurantAPI } from '@/services/api';
import { Restaurant } from '@/types';
import { Image } from "@/components/ui/image";
import { EmptyState } from '@/components/EmptyState';

export default function SavedRestaurantsScreen() {
    const { wishlist, toggleWishlist } = useWishlist();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            if (wishlist.length === 0) { setLoading(false); return; }
            try {
                const results = await Promise.all(wishlist.map(id => restaurantAPI.getById(id)));
                setRestaurants(results.map(r => r.data));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [wishlist]);

    const header = (
        <View style={{ backgroundColor: '#06C167' }}>
            <SafeAreaView edges={['top']}>
                <HStack className="px-4 py-3 items-center gap-3">
                    <Pressable onPress={() => router.back()} hitSlop={8}>
                        <Icon as={ChevronLeft} className="text-white" style={{ width: 24, height: 24 }} />
                    </Pressable>
                    <Text className="text-white text-lg font-heading">Saved Restaurants</Text>
                </HStack>
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

    if (wishlist.length === 0 || restaurants.length === 0) return (
        <Box className="flex-1 bg-white">
            {header}
            <EmptyState
                icon={Heart}
                title="No saved restaurants"
                message="Tap the heart on any restaurant to save it here."
                actionLabel="Browse Restaurants"
                onAction={() => router.push('/(tabs)')}
            />
        </Box>
    );

    return (
        <Box className="flex-1 bg-gray-50">
            {header}
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {restaurants.map(restaurant => (
                    <Pressable key={restaurant.id} onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}>
                        <Box className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm">
                            <Image
                                source={{ uri: restaurant.image }}
                                alt={restaurant.name}
                                className="w-full h-40"
                                resizeMode="cover"
                            />
                            <HStack className="p-3 justify-between items-start">
                                <VStack className="flex-1 gap-1 mr-3">
                                    <Text className="font-heading text-base">{restaurant.name}</Text>
                                    <HStack className="gap-3 items-center">
                                        <HStack className="items-center gap-1">
                                            <Icon as={Star} className="text-yellow-400 fill-yellow-400" style={{ width: 13, height: 13 }} />
                                            <Text className="text-xs text-gray-600">{restaurant.rating.toFixed(1)}</Text>
                                        </HStack>
                                        <HStack className="items-center gap-1">
                                            <Icon as={Clock} className="text-gray-400" style={{ width: 13, height: 13 }} />
                                            <Text className="text-xs text-gray-600">{restaurant.deliveryTimeEst} min</Text>
                                        </HStack>
                                        <Text className="text-xs text-gray-400">{restaurant.cuisineType}</Text>
                                    </HStack>
                                </VStack>
                                <Pressable
                                    onPress={(e) => { e.stopPropagation?.(); toggleWishlist(restaurant.id); }}
                                    hitSlop={8}
                                    className="p-2 rounded-full bg-red-50"
                                >
                                    <Icon as={Trash2} className="text-red-400" style={{ width: 16, height: 16 }} />
                                </Pressable>
                            </HStack>
                        </Box>
                    </Pressable>
                ))}
            </ScrollView>
        </Box>
    );
}
