import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View, Animated, Easing } from 'react-native';
import { Restaurant } from '../types';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Star, Clock, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

let MapViewComp: any = null;
let MarkerComp: any = null;
let PROVIDER: any = null;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapViewComp = Maps.default;
    MarkerComp = Maps.Marker;
    PROVIDER = Maps.PROVIDER_GOOGLE;
}

// Static require map — bundled at build time, no async loading
const cuisineIconAssets: Record<string, any> = {
    'c1.png': require('../assets/categories/c1.png'),
    'c2.png': require('../assets/categories/c2.png'),
    'c3.png': require('../assets/categories/c3.png'),
    'c4.png': require('../assets/categories/c4.png'),
    'c5.png': require('../assets/categories/c5.png'),
    'c6.png': require('../assets/categories/c6.png'),
    'c7.png': require('../assets/categories/c7.png'),
};

// Extract filename from a URL like https://i.ibb.co/83gV8bk/c1.png -> c1.png
function getLocalAsset(iconUrl: string): any {
    const filename = iconUrl?.split('/').pop() ?? '';
    return cuisineIconAssets[filename] ?? null;
}

interface Props {
    restaurants: Restaurant[];
    userCoords: { latitude: number; longitude: number };
}

const CuisineMarker: React.FC<{
    restaurant: Restaurant;
    isSelected: boolean;
    onMarkerPress: (r: Restaurant) => void;
}> = ({ restaurant: r, isSelected, onMarkerPress }) => {
    const asset = getLocalAsset(r.cuisineIcon);
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isSelected) {
            Animated.sequence([
                // Animated.timing(bounceAnim, { toValue: -14, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.spring(bounceAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 12 }),
            ]).start();
        }
    }, [isSelected]);

    // Always use a child Image (never the `image` prop) to avoid Android release-mode DPI scaling bug
    return (
        <MarkerComp
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            onPress={() => onMarkerPress(r)}
            tracksViewChanges={false}
        >
            {asset ? (
                <Animated.Image
                    source={asset}
                    style={{
                        width: isSelected ? 60 : 44,
                        height: isSelected ? 60 : 44,
                        transform: [{ translateY: bounceAnim }],
                    }}
                    resizeMode="contain"
                />
            ) : null}
        </MarkerComp>
    );
};

const MapRestaurantsView: React.FC<Props> = ({ restaurants, userCoords }) => {
    const [selected, setSelected] = useState<Restaurant | null>(null);
    const markerPressedRef = useRef(false);
    const cardAnim = useRef(new Animated.Value(0)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    const handleMarkerPress = useCallback((r: Restaurant) => {
        markerPressedRef.current = true;
        setSelected(r);
        // Animate card in
        cardAnim.setValue(60);
        cardOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
            Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        setTimeout(() => { markerPressedRef.current = false; }, 300);
    }, []);

    if (Platform.OS === 'web' || !MapViewComp) {
        return (
            <Box className="flex-1 justify-center items-center">
                <Text className="text-gray-500">Map view is available on mobile only.</Text>
            </Box>
        );
    }

    return (
        <View style={StyleSheet.absoluteFill}>
            <MapViewComp
                provider={PROVIDER}
                style={StyleSheet.absoluteFill}
                initialRegion={{ ...userCoords, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
                onPress={() => {
                    if (!markerPressedRef.current) setSelected(null);
                }}
            >
                <MarkerComp
                    coordinate={userCoords}
                    pinColor="red"
                    title="You are here"
                />
                {restaurants.map(r => (
                    <CuisineMarker
                        key={r.id}
                        restaurant={r}
                        isSelected={selected?.id === r.id}
                        onMarkerPress={handleMarkerPress}
                    />
                ))}
            </MapViewComp>

            {selected && (
                <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOpacity }]}>
                    <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        onPress={() => {
                            const id = selected.id;
                            setSelected(null);
                            router.push(`/restaurant/${id}` as any);
                        }}
                    >
                    <Image
                        source={{ uri: selected.image }}
                        alt={selected.name}
                        style={styles.logo}
                        resizeMode="cover"
                    />
                    <VStack style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{selected.name}</Text>
                        <Text style={styles.cuisine} numberOfLines={1}>{selected.cuisineType}</Text>
                        <HStack style={styles.meta}>
                            <HStack style={styles.metaItem}>
                                <Icon as={Star} size="xs" style={styles.starIcon} />
                                <Text style={styles.metaText}>{selected.rating.toFixed(1)}</Text>
                            </HStack>
                            <HStack style={styles.metaItem}>
                                <Icon as={Clock} size="xs" style={styles.clockIcon} />
                                <Text style={styles.metaText}>{selected.deliveryTimeEst} min</Text>
                            </HStack>
                            <Text style={styles.fee}>${selected.deliveryFee.toFixed(2)} delivery</Text>
                        </HStack>
                    </VStack>
                    <Icon as={ChevronRight} size="sm" style={styles.chevron} />
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        gap: 2,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },
    cuisine: {
        fontSize: 12,
        color: '#6b7280',
    },
    meta: {
        marginTop: 4,
        alignItems: 'center',
        gap: 8,
    },
    metaItem: {
        alignItems: 'center',
        gap: 3,
    },
    starIcon: {
        color: '#facc15',
    },
    clockIcon: {
        color: '#9ca3af',
    },
    metaText: {
        fontSize: 12,
        color: '#374151',
    },
    fee: {
        fontSize: 12,
        color: '#6b7280',
    },
    chevron: {
        color: '#9ca3af',
        marginLeft: 4,
    },
});

export default MapRestaurantsView;
