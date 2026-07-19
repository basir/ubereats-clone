import { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, RefreshControl, Modal, Image as RNImage, Animated, Easing } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { List, Map } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { RestaurantCard } from '../../components/RestaurantCard';
import { AddressPickerMap } from '../../components/AddressPickerMap';
import MapRestaurantsView from '../../components/MapRestaurantsView';
import { restaurantAPI, bannerAPI, cuisineCategoryAPI } from '../../services/api';
import { Restaurant, Banner, Category } from '../../types';
import { useLocation } from '../../context/LocationContext';
import { calculateDistance } from '../../utils/location';
import { BannerCarousel } from '../../components/BannerCarousel';
import MotoLoader from '@/components/MotoLoader';

const SkeletonCard = ({ shimmer }: { shimmer: Animated.Value }) => {
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
    return (
        <Animated.View style={{ opacity, marginBottom: 12 }}>
            <Box className="bg-white rounded-xl overflow-hidden shadow-sm">
                <Box style={{ width: '100%', height: 224, backgroundColor: '#e5e7eb' }} />
                <VStack className="p-3 gap-2">
                    <Box style={{ height: 16, width: '60%', backgroundColor: '#e5e7eb', borderRadius: 8 }} />
                    <Box style={{ height: 12, width: '80%', backgroundColor: '#f3f4f6', borderRadius: 8 }} />
                </VStack>
            </Box>
        </Animated.View>
    );
};

const CuisineChip = ({ label, icon, active, onPress }: { label: string; icon?: string; active: boolean; onPress: () => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
        ]).start();
        onPress();
    };
    return (
        <Animated.View style={{ transform: [{ scale }], marginRight: 8 }}>
            <Pressable onPress={handlePress}>
                <HStack className={`px-3 py-2 rounded-full items-center gap-1.5 ${active ? 'bg-green-500' : 'bg-white border border-gray-200'}`}>
                    {icon ? (
                        <RNImage source={{ uri: icon }} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    ) : null}
                    <Text className={`text-sm font-heading ${active ? 'text-white' : 'text-gray-700'}`}>{label}</Text>
                </HStack>
            </Pressable>
        </Animated.View>
    );
};

export default function HomeScreen() {
    const { deliveryLocation, requestCurrentLocation, setDeliveryLocation } = useLocation();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [cuisines, setCuisines] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [showAddressPicker, setShowAddressPicker] = useState(false);

    // Shimmer for skeleton
    const shimmer = useRef(new Animated.Value(0)).current;
    // Map toggle button rotation
    const toggleRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [restRes, bannerRes, cuisineRes] = await Promise.all([
                restaurantAPI.getAll(),
                bannerAPI.getAll(),
                cuisineCategoryAPI.getAll(),
            ]);
            // console.log('[HomeScreen] restaurants count:', restRes.data.length);
            // console.log('[HomeScreen] restaurants data:', JSON.stringify(restRes.data, null, 2));
            // console.log('[HomeScreen] banners count:', bannerRes.data.length);
            // console.log('[HomeScreen] cuisines count:', cuisineRes.data.length);
            setRestaurants(restRes.data);
            setBanners(bannerRes.data);
            setCuisines(cuisineRes.data);
        } catch (e) {
            console.error('[HomeScreen] Error fetching home data:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        if (!deliveryLocation) requestCurrentLocation();
    }, []);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handleToggleView = () => {
        Animated.sequence([
            Animated.timing(toggleRotate, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(toggleRotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]).start();
        setViewMode(v => v === 'list' ? 'map' : 'list');
    };

    const toggleSpin = toggleRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    const filteredRestaurants = selectedCuisine
        ? restaurants.filter(r => r.cuisineType === selectedCuisine)
        : restaurants;

    const enrich = (list: Restaurant[]) => list.map(r => ({
        ...r,
        distanceKm: deliveryLocation
            ? calculateDistance(deliveryLocation.latitude, deliveryLocation.longitude, r.latitude, r.longitude)
            : undefined,
    }));

    const enriched = enrich(filteredRestaurants);
    const isFallback = enriched.length === 0 && restaurants.length > 0;
    const displayList = isFallback ? enrich(restaurants) : enriched;

    const defaultCoords = deliveryLocation ?? { latitude: 37.7749, longitude: -122.4194 };

    if (loading) {
        return (
            <Box className="flex-1 bg-gray-50">
                <Header onAddressPress={() => {}} />
                <ScrollView>
                    <Box style={{ width: '100%', height: 200, backgroundColor: '#e5e7eb', marginBottom: 12 }} />
                    <VStack className="px-4 pt-2 pb-24 gap-0">
                        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} shimmer={shimmer} />)}
                    </VStack>
                </ScrollView>
            </Box>
        );
    }

    // return   <Box className="flex-1 bg-white">
          
    //             <Box className="flex-1 justify-center items-center">
    //                 <MotoLoader />
    //             </Box>
    //         </Box>
     

    return (
        <Box className="flex-1 bg-gray-50">
            <Header onAddressPress={() => setShowAddressPicker(true)} />

            <Modal visible={showAddressPicker} animationType="slide" statusBarTranslucent>
                <Box style={{ flex: 1 }}>
                    <AddressPickerMap
                        initialCoords={defaultCoords}
                        onLocationSelected={(loc) => {
                            setDeliveryLocation(loc);
                            setShowAddressPicker(false);
                        }}
                        onClose={() => setShowAddressPicker(false)}
                    />
                </Box>
            </Modal>

            {viewMode === 'list' ? (
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06C167" />}
                >
                    {banners.length > 0 && <BannerCarousel banners={banners} />}

                    <Box className="py-3">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                            <CuisineChip label="All" active={!selectedCuisine} onPress={() => setSelectedCuisine(null)} />
                            {cuisines.map(c => (
                                <CuisineChip
                                    key={c.id}
                                    label={c.name}
                                    icon={c.image}
                                    active={selectedCuisine === c.name}
                                    onPress={() => setSelectedCuisine(selectedCuisine === c.name ? null : c.name)}
                                />
                            ))}
                        </ScrollView>
                    </Box>

                    <VStack className="px-4 pb-24">
                        <Text className="text-lg font-heading mb-3">
                            {isFallback ? 'All Restaurants' : selectedCuisine ? selectedCuisine : 'Restaurants near you'}
                        </Text>
                        {isFallback && (
                            <Text className="text-sm text-gray-400 mb-3">No restaurants near you — showing all available</Text>
                        )}
                        {displayList.length === 0 ? (
                            <Box className="py-12 items-center">
                                <Text className="text-gray-400">No restaurants found</Text>
                            </Box>
                        ) : (
                            displayList.map((r, i) => (
                                <RestaurantCard key={r.id} restaurant={r} distanceKm={r.distanceKm} index={i} />
                            ))
                        )}
                    </VStack>
                </ScrollView>
            ) : (
                <Box style={{ flex: 1 }}>
                    <MapRestaurantsView restaurants={displayList} userCoords={defaultCoords} />
                </Box>
            )}

            <Box className="absolute bottom-24 right-4">
                <Pressable
                    onPress={handleToggleView}
                    className="bg-white rounded-full p-3 shadow-lg border border-gray-200"
                >
                    <Animated.View style={{ transform: [{ rotate: toggleSpin }] }}>
                        <Icon as={viewMode === 'list' ? Map : List} className="text-gray-700" style={{ width: 24, height: 24 }} />
                    </Animated.View>
                </Pressable>
            </Box>
        </Box>
    );
}
