import { StatusBar } from 'expo-status-bar';
import { Modal, StyleSheet, TouchableOpacity, Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Order } from '@/types';
import { X, MapPin } from 'lucide-react-native';
import { useLocation } from '@/context/LocationContext';
import { OrderTrackingMap } from '@/components/OrderTrackingMap';

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
    order: Order;
    onClose: () => void;
    cuisineIcon?: string;
}

export const OrderMapTracker = ({ order, onClose, cuisineIcon }: Props) => {
    const insets = useSafeAreaInsets();
    const { deliveryLocation } = useLocation();

    const restaurantCoords = order.restaurantLocation ?? { latitude: 47.608, longitude: -122.335 };
    const userCoords = deliveryLocation
        ? { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
        : { latitude: order.deliveryAddress.latitude, longitude: order.deliveryAddress.longitude };

    const shortId = order.orderNumber?.slice(-6).toUpperCase() ?? order.id.slice(-6).toUpperCase();
    const statusColor = STATUS_COLOR[order.status];

    // Remaining time estimate (same logic as LastOrderStatus)
    const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    const remainingMins = Math.max(0, Math.round(15 - elapsed));
    const etaCountdown = order.status === 'out_for_delivery' && remainingMins <= 5
        ? 'Arriving soon'
        : remainingMins === 0 ? 'Any moment now'
        : `~${remainingMins} min`;

    return (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
            <StatusBar style="light" />
            {/* Full green status bar area, map goes edge to edge below it */}
            <View style={styles.container}>
                <View style={[styles.statusBarFill, { height: insets.top }]} />
                {/* Map — fills all remaining space above the sheet */}
                <View style={styles.mapContainer}>
                    <OrderTrackingMap
                        restaurantCoords={restaurantCoords}
                        userCoords={userCoords}
                        orderStatus={order.status}
                        totalMinutes={15}
                        fillContainer
                        cuisineIcon={cuisineIcon}
                    />

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                        <View style={styles.closeBtnInner}>
                            <X color="#111827" width={18} height={18} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Bottom sheet */}
                <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.sheetHandle} />

                    <View style={styles.sheetHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE ORDER</Text>
                        </View>
                        <Text style={styles.orderId}>#{shortId}</Text>
                    </View>

                    <Text style={styles.restaurantName}>{order.restaurantName}</Text>

                    {/* Status + ETA row */}
                    <View style={styles.statusRow}>
                        <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {STATUS_LABEL[order.status]}
                            </Text>
                        </View>
                        <View style={styles.etaChip}>
                            <Text style={styles.etaText}>{etaCountdown}</Text>
                        </View>
                    </View>

                    {/* Items */}
                    <View style={styles.itemsContainer}>
                        {order.items.map((item, i) => (
                            <View key={i} style={styles.itemRow}>
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                </View>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Delivery address */}
                    <View style={styles.addressRow}>
                        <MapPin color="#06C167" width={14} height={14} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {deliveryLocation?.address ?? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    statusBarFill: { backgroundColor: '#06C167', width: '100%' },
    mapContainer: { flex: 1, position: 'relative' },
    closeBtn: { position: 'absolute', top: 16, right: 16 },
    closeBtnInner: {
        backgroundColor: '#fff', borderRadius: 20,
        width: 36, height: 36,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
        maxHeight: SCREEN_HEIGHT * 0.46,
    },
    sheetHandle: {
        width: 36, height: 4, backgroundColor: '#E5E7EB',
        borderRadius: 2, alignSelf: 'center', marginBottom: 14,
    },
    sheetHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#06C167' },
    liveText: { fontSize: 11, fontWeight: '700', color: '#06C167', letterSpacing: 1.2 },
    orderId: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.8 },
    restaurantName: {
        fontSize: 20, fontWeight: '700', color: '#111827',
        letterSpacing: -0.3, marginBottom: 10,
    },
    statusRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
    etaChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#ECFDF5', paddingHorizontal: 10,
        paddingVertical: 5, borderRadius: 20,
    },
    etaText: { fontSize: 12, fontWeight: '700', color: '#06C167' },
    itemsContainer: { gap: 8, marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBadge: {
        backgroundColor: '#F3F4F6', borderRadius: 6,
        width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    },
    qtyText: { fontSize: 12, fontWeight: '700', color: '#374151' },
    itemName: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
    itemPrice: { fontSize: 14, color: '#111827', fontWeight: '600' },
    addressRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
    },
    addressText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },
});
