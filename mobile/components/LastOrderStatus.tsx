import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { orderAPI, restaurantAPI } from '@/services/api';
import { Order } from '@/types';
import { Clock, MapPin } from 'lucide-react-native';
import { OrderMapTracker } from '@/components/OrderMapTracker';

const STATUS_LABEL: Record<Order['status'], string> = {
    pending: 'Pending',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<Order['status'], string> = {
    pending: '#F59E0B',
    preparing: '#3B82F6',
    ready_for_pickup: '#8B5CF6',
    out_for_delivery: '#06C167',
    delivered: '#6B7280',
    cancelled: '#EF4444',
};

interface Props {
    userId: string;
    refresh?: number;
}

// Estimate remaining delivery time in minutes
const getRemainingMins = (createdAt: string, deliveryTimeEst: number): number => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000;
    return Math.max(0, Math.round(deliveryTimeEst - elapsed));
};

export const LastOrderStatus = ({ userId, refresh }: Props) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [deliveryTimeEst, setDeliveryTimeEst] = useState<number>(30);
    const [cuisineIcon, setCuisineIcon] = useState<string>('');
    const [showMap, setShowMap] = useState(false);
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        orderAPI.getByUser(userId).then(async ({ data }) => {
            const active = data
                .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latest = active[0] ?? null;
            setOrder(latest);
            if (latest) {
                try {
                    const { data: rest } = await restaurantAPI.getById(latest.restaurantId);
                    setDeliveryTimeEst(rest.deliveryTimeEst ?? 30);
                    setCuisineIcon(rest.cuisineIcon ?? '');
                } catch { /* use default */ }
            }
        });
    }, [userId, refresh]);

    // Animate only the border color — 0 = dim green, 1 = bright green
    useEffect(() => {
        if (!order) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [order]);

    if (!order) return null;

    const statusColor = STATUS_COLOR[order.status];
    const shortId = order.orderNumber?.slice(-6).toUpperCase() ?? order.id.slice(-6).toUpperCase();
    const remainingMins = getRemainingMins(order.createdAt, deliveryTimeEst);

    const animatedBorderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(6,193,103,0.35)', 'rgba(6,193,103,1)'],
    });

    const animatedShadowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.55],
    });

    return (
        <>
            {/* Static wrapper for margin/layout */}
            <View style={styles.wrapper}>
                {/* Animated border-only layer */}
                <Animated.View
                    style={[
                        styles.borderLayer,
                        {
                            borderColor: animatedBorderColor,
                            shadowColor: '#06C167',
                            shadowOpacity: animatedShadowOpacity,
                        },
                    ]}
                    pointerEvents="none"
                />

                {/* Card content — static white background, no opacity change */}
                <Box style={styles.card}>
                    {/* Live indicator + order id */}
                    <HStack style={styles.header}>
                        <HStack style={styles.liveRow}>
                            <Box style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE ORDER</Text>
                        </HStack>
                        <Text style={styles.orderId}>#{shortId}</Text>
                    </HStack>

                    {/* Restaurant name */}
                    <Text style={styles.restaurantName}>{order.restaurantName}</Text>

                    {/* Items */}
                    <Text style={styles.itemsLabel}>
                        {order.items.map(i => `${i.quantity}× ${i.name}`).join('  ·  ')}
                    </Text>

                    {/* Status + ETA row */}
                    <HStack style={styles.statusRow}>
                        <Box style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
                            <Box style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {STATUS_LABEL[order.status]}
                            </Text>
                        </Box>

                        <HStack style={styles.etaChip}>
                            <Clock color="#06C167" width={12} height={12} />
                            <Text style={styles.etaText}>
                                {order.status === 'out_for_delivery' && remainingMins <= 5
                                    ? 'Arriving soon'
                                    : remainingMins === 0
                                    ? 'Any moment now'
                                    : `~${remainingMins} min`}
                            </Text>
                        </HStack>
                    </HStack>

                    {/* View on Map button */}
                    <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(true)} activeOpacity={0.85}>
                        <MapPin color="#fff" width={16} height={16} />
                        <Text style={styles.mapButtonText}>View on Map</Text>
                    </TouchableOpacity>
                </Box>
            </View>

            {showMap && (
                <OrderMapTracker order={order} cuisineIcon={cuisineIcon} onClose={() => setShowMap(false)} />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 18,
    },
    // Sits on top of the card, animates only border + shadow — no background
    borderLayer: {
        position: 'absolute',
        inset: 0,
        borderRadius: 18,
        borderWidth: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
        zIndex: 1,
        pointerEvents: 'none',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 18,
        gap: 10,
    },
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveRow: {
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#06C167',
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#06C167',
        letterSpacing: 1.2,
    },
    orderId: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        letterSpacing: 0.8,
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.3,
    },
    itemsLabel: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
    },
    statusRow: {
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#06C167',
        borderRadius: 12,
        paddingVertical: 13,
        marginTop: 4,
    },
    mapButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    etaChip: {
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    etaText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#06C167',
    },
});
