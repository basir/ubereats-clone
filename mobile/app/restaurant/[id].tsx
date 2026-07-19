import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SectionList, Alert, Animated, View, Easing, Image as RNImage } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Image } from "@/components/ui/image";
import { Icon } from "@/components/ui/icon";
import MotoLoader from '../../components/MotoLoader';
import { Spinner } from "@/components/ui/spinner";
import { Star, Clock, ChevronLeft, Plus } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { restaurantAPI, menuItemAPI, reviewAPI } from '../../services/api';
import { Restaurant, MenuItem, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { ReviewList } from '../../components/ReviewList';

// Must match the w-20 h-20 class on the item image (80px)
const ITEM_IMG_SIZE = 80;

type FlyingItem = {
    id: number;
    imageUri: string;
    anim: Animated.ValueXY;
    opacity: Animated.Value;
    scale: Animated.Value;
};

// Separate component so each row owns its image ref for accurate measureInWindow
function MenuItemRow({
    item,
    onAdd,
    hostRef,
    index = 0,
}: {
    item: MenuItem;
    onAdd: (item: MenuItem, x: number, y: number) => Promise<void>;
    hostRef: React.RefObject<View | null>;
    index?: number;
}) {
    const imgRef = useRef<RNImage>(null);
    const [adding, setAdding] = useState(false);

    // Fade + slide-up entrance animation (same as RestaurantCard)
    const translateY = useRef(new Animated.Value(40)).current;
    const opacity = useRef(new Animated.Value(0)).current;

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

    const handlePress = async () => {
        if (adding) return;
        setAdding(true);
        console.log('[MenuItemRow] handlePress start', item.name);
        try {
            await new Promise<void>((resolve, reject) => {
                if (!imgRef.current) {
                    console.log('[MenuItemRow] imgRef is null — resolving immediately');
                    onAdd(item, 0, 0).then(resolve).catch(reject);
                    return;
                }
                imgRef.current.measureInWindow((ix, iy) => {
                    console.log('[MenuItemRow] imgRef measured', ix, iy);
                    if (!hostRef.current) {
                        console.log('[MenuItemRow] hostRef is null — resolving with imgPos only');
                        onAdd(item, ix, iy).then(resolve).catch(reject);
                        return;
                    }
                    hostRef.current.measureInWindow((hx, hy) => {
                        console.log('[MenuItemRow] hostRef measured', hx, hy);
                        onAdd(item, ix - hx, iy - hy).then(resolve).catch(reject);
                    });
                });
            });
            console.log('[MenuItemRow] handlePress done');
        } catch (e) {
            console.error('[MenuItemRow] handlePress error', e);
        } finally {
            setAdding(false);
        }
    };

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Box className="bg-white px-4 py-3 border-b border-gray-50">
            <HStack className="gap-3 items-center">
                <RNImage
                    ref={imgRef}
                    source={{ uri: item.image }}
                    style={{ width: ITEM_IMG_SIZE, height: ITEM_IMG_SIZE, borderRadius: 12 }}
                    resizeMode="cover"
                />
                <VStack className="flex-1 gap-1">
                    <Text className="font-heading text-base">{item.name}</Text>
                    <Text className="text-gray-500 text-xs" numberOfLines={2}>{item.description}</Text>
                    <HStack className="justify-between items-center mt-1">
                        <Text className="font-heading text-base">${item.price.toFixed(2)}</Text>
                        {item.inStock ? (
                            <Pressable
                                onPress={handlePress}
                                disabled={adding}
                                className="bg-green-500 rounded-full p-2.5"
                                style={{ opacity: adding ? 0.6 : 1 }}
                            >
                                {adding
                                    ? <Spinner size="small" className="text-white" style={{ width: 24, height: 24 }} />
                                    : <Icon as={Plus} className="text-white" style={{ width: 24, height: 24 }} />
                                }
                            </Pressable>
                        ) : (
                            <Text className="text-xs text-red-400">Unavailable</Text>
                        )}
                    </HStack>
                </VStack>
            </HStack>
        </Box>
        </Animated.View>
    );
}

// Stable header component — defined outside to prevent re-mount on parent re-render
function RestaurantHeader({ restaurant, onScrollToReviews }: { restaurant: Restaurant; onScrollToReviews: () => void }) {
    return (
        <Box>
            <Image
                source={{ uri: restaurant.image }}
                alt={restaurant.name}
                className="w-full h-56"
                resizeMode="cover"
            />
            <Box className="bg-white p-4 mb-2">
                <Heading className="text-xl mb-1">{restaurant.name}</Heading>
                <Text className="text-gray-500 text-sm mb-2">{restaurant.cuisineType} • {restaurant.address}</Text>
                <HStack className="gap-4">
                    <Pressable onPress={onScrollToReviews}>
                        <HStack className="items-center gap-1">
                            <Icon as={Star} className="text-yellow-400 fill-yellow-400" style={{ width: 16, height: 16 }} />
                            <Text className="text-sm font-heading">{restaurant.rating.toFixed(1)}</Text>
                            <Text className="text-sm text-gray-400 underline">({restaurant.ratingCount})</Text>
                        </HStack>
                    </Pressable>
                    <HStack className="items-center gap-1">
                        <Icon as={Clock} className="text-gray-400" style={{ width: 16, height: 16 }} />
                        <Text className="text-sm text-gray-600">{restaurant.deliveryTimeEst} min</Text>
                    </HStack>
                    <Text className="text-sm text-gray-600">${restaurant.deliveryFee.toFixed(2)} delivery</Text>
                </HStack>
            </Box>
        </Box>
    );
}

export default function RestaurantScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addToCart, clearCart, restaurantId: cartRestaurantId, itemCount } = useCart();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    // Refs for measuring positions
    const basketBadgeRef = useRef<View>(null);
    const basketBadgePos = useRef({ x: 0, y: 0 });
    const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
    // Badge bounce animation
    const badgeScale = useRef(new Animated.Value(1)).current;
    const flyCounter = useRef(0);

    useEffect(() => {
        const load = async () => {
            try {
                const [restRes, menuRes, reviewRes] = await Promise.all([
                    restaurantAPI.getById(id),
                    menuItemAPI.getByRestaurant(id),
                    reviewAPI.getByRestaurant(id),
                ]);
                setRestaurant(restRes.data);
                setMenuItems(menuRes.data);
                setReviews(reviewRes.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const rootRef = useRef<View>(null);
    const sectionListRef = useRef<SectionList>(null);

    const scrollToReviews = useCallback(() => {
        sectionListRef.current?.getScrollResponder()?.scrollToEnd({ animated: true });
    }, []);

    const measureBadge = useCallback(() => {
        if (!basketBadgeRef.current || !rootRef.current) return;
        basketBadgeRef.current.measureInWindow((x, y, width, height) => {
            rootRef.current?.measureInWindow((rx, ry) => {
                basketBadgePos.current = {
                    x: (x - rx) + width / 2,
                    y: (y - ry) + height / 2,
                };
            });
        });
    }, []);

    const triggerFlyAnimation = useCallback((imgX: number, imgY: number, imageUri: string, onDone?: () => void) => {
        console.log('[triggerFlyAnimation] start', imgX, imgY, 'target:', basketBadgePos.current);
        const target = basketBadgePos.current;
        const uid = ++flyCounter.current;

        const finalScale = 0.15;
        const endX = target.x - ITEM_IMG_SIZE / 2;
        const endY = target.y - ITEM_IMG_SIZE / 2;

        // Scale duration by distance: 400ms for ~100px, 800ms for ~600px+
        const dx = endX - imgX;
        const dy = endY - imgY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.round(Math.min(1500, Math.max(1000, distance * 1.9)));

        const anim = new Animated.ValueXY({ x: imgX, y: imgY });
        const opacity = new Animated.Value(1);
        const scale = new Animated.Value(1);

        setFlyingItems(prev => [...prev, { id: uid, imageUri, anim, opacity, scale }]);

        Animated.parallel([
            Animated.timing(anim, {
                toValue: { x: endX, y: endY },
                duration,
                easing: Easing.bezier(0.3, 0.0, 0.2, 1.0),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: finalScale,
                duration,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.delay(duration * 0.8),
                Animated.timing(opacity, { toValue: 0, duration: duration * 0.2, useNativeDriver: true }),
            ]),
        ]).start(() => {
            console.log('[triggerFlyAnimation] animation done, calling onDone');
            setFlyingItems(prev => prev.filter(d => d.id !== uid));
            // Commit the cart state update (bumps count) then bounce the badge
            onDone?.();
            Animated.sequence([
                Animated.timing(badgeScale, { toValue: 1.4, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(badgeScale, { toValue: 1, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ]).start();
        });
    }, [badgeScale]);

    // Helper: wait for basket button to mount and get its position, then animate
    const animateAfterBadgeMounts = useCallback((imgX: number, imgY: number, imageUri: string, onDone?: () => void) => {
        console.log('[animateAfterBadgeMounts] start');
        let attempts = 0;
        const tryMeasure = () => {
            if (!basketBadgeRef.current || !rootRef.current) {
                if (attempts++ < 10) setTimeout(tryMeasure, 50);
                return;
            }
            basketBadgeRef.current.measureInWindow((x, y, width, height) => {
                if (width > 0) {
                    rootRef.current?.measureInWindow((rx, ry) => {
                        basketBadgePos.current = {
                            x: (x - rx) + width / 2,
                            y: (y - ry) + height / 2,
                        };
                        triggerFlyAnimation(imgX, imgY, imageUri, onDone);
                    });
                } else if (attempts++ < 10) {
                    setTimeout(tryMeasure, 50);
                }
            });
        };
        setTimeout(tryMeasure, 80);
    }, [triggerFlyAnimation]);

    const handleAddToCart = useCallback(async (item: MenuItem, imgX: number, imgY: number) => {
        console.log('[handleAddToCart] called', item.name, imgX, imgY);
        const result = await addToCart(item);
        console.log('[handleAddToCart] addToCart result', result.requiresClear, 'hasCommit:', !!result.commit);
        if (result.requiresClear) {
            Alert.alert(
                'Start new basket?',
                'Your basket contains items from another restaurant. Clear it and start a new order?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Clear & Add',
                        style: 'destructive',
                        onPress: async () => {
                            await clearCart();
                            const addResult = await addToCart(item);
                            console.log('[handleAddToCart] after clearCart, addToCart result', addResult.requiresClear, 'hasCommit:', !!addResult.commit);
                            // Commit immediately so the basket FAB appears, then animate to it
                            await addResult.commit?.();
                            animateAfterBadgeMounts(imgX, imgY, item.image);
                        },
                    },
                ]
            );
        } else {
            console.log('[handleAddToCart] basketBadgePos', basketBadgePos.current);
            if (basketBadgePos.current.x > 0) {
                // Badge already visible — animate first, commit when it lands
                triggerFlyAnimation(imgX, imgY, item.image, result.commit);
            } else {
                // First item: commit immediately so the FAB renders, then animate to it
                await result.commit?.();
                animateAfterBadgeMounts(imgX, imgY, item.image);
            }
        }
    }, [addToCart, clearCart, triggerFlyAnimation, animateAfterBadgeMounts]);

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <MotoLoader />
            </Box>
        );
    }

    if (!restaurant) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <Text>Restaurant not found</Text>
            </Box>
        );
    }

    const categorized = menuItems.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    const sections = Object.entries(categorized).map(([title, data]) => ({ title, data }));

    return (
        <View ref={rootRef} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <HStack className="px-4 py-3 items-center gap-3">
                        <Pressable onPress={() => router.back()}>
                            <Icon as={ChevronLeft} className="text-white" style={{ width: 24, height: 24 }} />
                        </Pressable>
                        <Text className="text-white text-lg font-heading" numberOfLines={1}>{restaurant.name}</Text>
                    </HStack>
                </SafeAreaView>
            </View>
            <SectionList
                ref={sectionListRef}
                sections={sections}
                keyExtractor={item => item.id}
                ListHeaderComponent={() => (
                    <RestaurantHeader restaurant={restaurant} onScrollToReviews={scrollToReviews} />
                )}
                ListFooterComponent={() => (
                    <Box className="bg-white px-4 pt-4 pb-2 mt-2">
                        <Text className="font-heading text-gray-800 text-base mb-3">Reviews</Text>
                        <ReviewList reviews={reviews} />
                    </Box>
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <Box className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                        <Text className="font-heading text-gray-700 text-sm uppercase">{title}</Text>
                    </Box>
                )}
                renderItem={({ item, index, section }) => {
                    const sectionOffset = sections
                        .slice(0, sections.findIndex(s => s.title === section.title))
                        .reduce((sum, s) => sum + s.data.length, 0);
                    return (
                        <MenuItemRow
                            item={item}
                            onAdd={handleAddToCart}
                            hostRef={rootRef}
                            index={sectionOffset + index}
                        />
                    );
                }}
                contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
            />

            {/* Flying item thumbnails */}
            {flyingItems.map(fi => (
                <Animated.View
                    key={fi.id}
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: ITEM_IMG_SIZE,
                        height: ITEM_IMG_SIZE,
                        borderRadius: 12,
                        overflow: 'hidden',
                        zIndex: 999,
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 10,
                        opacity: fi.opacity,
                        transform: [
                            { translateX: fi.anim.x },
                            { translateY: fi.anim.y },
                            { scale: fi.scale },
                        ],
                    }}
                >
                    <Animated.Image
                        source={{ uri: fi.imageUri }}
                        style={{ width: ITEM_IMG_SIZE, height: ITEM_IMG_SIZE }}
                        resizeMode="cover"
                    />
                </Animated.View>
            ))}

            {/* View Basket FAB */}
            {itemCount > 0 && cartRestaurantId === id && (
                <View
                    style={{ position: 'absolute', bottom: insets.bottom + 12, left: 16, right: 16 }}
                    onLayout={measureBadge}
                >
                    <Button
                        className="bg-green-500 rounded-xl"
                        size="lg"
                        onPress={() => router.push('/(tabs)/cart')}
                    >
                        <HStack className="flex-1 justify-between items-center px-2">
                            <Animated.View
                                ref={basketBadgeRef}
                                onLayout={measureBadge}
                                style={{
                                    transform: [{ scale: badgeScale }],
                                    backgroundColor: '#16a34a',
                                    borderRadius: 6,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                }}
                            >
                                <Text className="text-white font-heading text-sm">{itemCount}</Text>
                            </Animated.View>
                            <ButtonText className="text-white"   numberOfLines={1}>View Basket</ButtonText>
                            <Box style={{ width: 32 }} />
                        </HStack>
                    </Button>
                </View>
            )}
        </View>
    );
}
