import React, { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import MotoLoader from '../../components/MotoLoader';
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RestaurantCard } from '../../components/RestaurantCard';
import { restaurantAPI } from '../../services/api';
import { Restaurant } from '../../types';
import { useLocation } from '../../context/LocationContext';
import { calculateDistance } from '../../utils/location';

type SortOption = 'rating_desc' | 'delivery_time_asc' | 'delivery_fee_asc' | null;

const SortChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} className="mr-2 mb-2">
        <Box className={`px-3 py-1.5 rounded-full border ${active ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'}`}>
            <Text className={`text-xs font-heading ${active ? 'text-white' : 'text-gray-700'}`}>{label}</Text>
        </Box>
    </Pressable>
);

export default function SearchScreen() {
    const { deliveryLocation } = useLocation();
    const [query, setQuery] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>(null);

    useEffect(() => {
        restaurantAPI.getAll().then(res => {
            setRestaurants(res.data);
            setLoading(false);
        }).catch(e => {
            console.error(e);
            setLoading(false);
        });
    }, []);

    const filtered = restaurants
        .filter(r => {
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return r.name.toLowerCase().includes(q) || r.cuisineType.toLowerCase().includes(q);
        })
        .map(r => ({
            ...r,
            distanceKm: deliveryLocation
                ? calculateDistance(deliveryLocation.latitude, deliveryLocation.longitude, r.latitude, r.longitude)
                : undefined,
        }))
        .sort((a, b) => {
            if (sortBy === 'rating_desc') return b.rating - a.rating;
            if (sortBy === 'delivery_time_asc') return a.deliveryTimeEst - b.deliveryTimeEst;
            if (sortBy === 'delivery_fee_asc') return a.deliveryFee - b.deliveryFee;
            return 0;
        });

    return (
        <Box className="flex-1 bg-gray-50">
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <Box className="bg-white px-4 pt-4 pb-2">
                    <HStack className="bg-gray-100 rounded-xl px-3 py-2 items-center gap-2">
                        <Icon as={Search} className="text-gray-400" style={{ width: 18, height: 18 }} />
                        <TextInput
                            placeholder="Search restaurants or cuisines..."
                            value={query}
                            onChangeText={setQuery}
                            className="flex-1 text-sm text-gray-800"
                            autoCapitalize="none"
                        />
                    </HStack>
                    <HStack className="mt-3 flex-wrap">
                        <SortChip label="Top Rated" active={sortBy === 'rating_desc'} onPress={() => setSortBy(sortBy === 'rating_desc' ? null : 'rating_desc')} />
                        <SortChip label="Fastest" active={sortBy === 'delivery_time_asc'} onPress={() => setSortBy(sortBy === 'delivery_time_asc' ? null : 'delivery_time_asc')} />
                        <SortChip label="Lowest Fee" active={sortBy === 'delivery_fee_asc'} onPress={() => setSortBy(sortBy === 'delivery_fee_asc' ? null : 'delivery_fee_asc')} />
                    </HStack>
                    </Box>
                </SafeAreaView>
            </View>

            {loading ? (
                <Box className="flex-1 justify-center items-center">
                    <MotoLoader />
                </Box>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Text className="text-sm text-gray-500 mb-3">{filtered.length} restaurants</Text>
                    {filtered.length === 0 ? (
                        <Box className="py-12 items-center">
                            <Text className="text-gray-400">No restaurants found</Text>
                        </Box>
                    ) : (
                        filtered.map(r => <RestaurantCard key={r.id} restaurant={r} distanceKm={r.distanceKm} />)
                    )}
                </ScrollView>
            )}
        </Box>
    );
}
