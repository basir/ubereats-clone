import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Dimensions, Image, Platform, View } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing as REasing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatLng { latitude: number; longitude: number; }

interface TrackingMapProps {
    restaurantCoords: LatLng;
    userCoords: LatLng;
    orderStatus: string;
    totalMinutes?: number;
    fillContainer?: boolean;
    /** Pass the cuisine icon filename e.g. "c3.png" to show on restaurant pin */
    cuisineIcon?: string;
    restaurantName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodePolyline(encoded: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let shift = 0, result = 0, b: number;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;
        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
}

function getBearing(from: LatLng, to: LatLng): number {
    const dLng = (to.longitude - from.longitude) * (Math.PI / 180);
    const lat1 = from.latitude * (Math.PI / 180);
    const lat2 = to.latitude * (Math.PI / 180);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function lerpCoord(a: LatLng, b: LatLng, t: number): LatLng {
    return { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t };
}

const cuisineAssets: Record<string, any> = {
    'c1.png': require('../assets/categories/c1.png'),
    'c2.png': require('../assets/categories/c2.png'),
    'c3.png': require('../assets/categories/c3.png'),
    'c4.png': require('../assets/categories/c4.png'),
    'c5.png': require('../assets/categories/c5.png'),
    'c6.png': require('../assets/categories/c6.png'),
    'c7.png': require('../assets/categories/c7.png'),
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const { width } = Dimensions.get('window');

// ─── Mock driving animation flag ──────────────────────────────────────────────
// Set to true to simulate driver movement on the route when status is 'pending'
const MOCK_DRIVING_ANIMATION = true;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated pulsing green ring — destination pin */
function PulsingPin() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.6);
    useEffect(() => {
        scale.value = withRepeat(withTiming(2.4, { duration: 1400, easing: REasing.out(REasing.ease) }), -1, false);
        opacity.value = withRepeat(withTiming(0, { duration: 1400, easing: REasing.out(REasing.ease) }), -1, false);
    }, []);
    const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
    return (
        <View style={styles.pinWrapper}>
            <Animated.View style={[styles.pulseRing, ringStyle]} />
            <View style={styles.pinDot} />
        </View>
    );
}

/** Red drop-pin SVG — user location */
function DropPin() {
    return (
        <Svg width={32} height={40} viewBox="0 0 32 40">
            <Path
                d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12C28 5.373 22.627 0 16 0z"
                fill="#EF4444"
            />
            <Circle cx="16" cy="12" r="5" fill="#fff" />
        </Svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrderTrackingMap({
    restaurantCoords,
    userCoords,
    orderStatus,
    totalMinutes = 15,
    fillContainer = false,
    cuisineIcon,
}: TrackingMapProps) {
    const mapRef = useRef<MapView>(null);
    const [route, setRoute] = useState<LatLng[]>([]);
    const [routeError, setRouteError] = useState(false);

    // Driver position (tracks along route for out_for_delivery, and mock pending animation)
    const [driverIndex, setDriverIndex] = useState(0);
    const [driverCoord, setDriverCoord] = useState<LatLng>(restaurantCoords);
    const [bearing, setBearing] = useState(0);
    const [etaLabel, setEtaLabel] = useState('');

    const isDelivering = orderStatus === 'out_for_delivery';
    const isMockDriving = MOCK_DRIVING_ANIMATION ; // && orderStatus === 'pending';
    const showMoto = ['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(orderStatus);

    // ── 1. Fetch route ──────────────────────────────────────────────────────
    useEffect(() => {
        setRoute([]);
        setDriverIndex(0);
        setRouteError(false);

        const origin = `${restaurantCoords.latitude},${restaurantCoords.longitude}`;
        const dest = `${userCoords.latitude},${userCoords.longitude}`;
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                console.log('[TrackingMap] directions status:', data.status, '| error:', data.error_message);
                const leg = data.routes?.[0]?.legs?.[0];
                if (!leg) { setRouteError(true); return; }
                const decoded = decodePolyline(data.routes[0].overview_polyline.points);
                console.log('[TrackingMap] route points:', decoded.length);
                setRoute(decoded);
                setDriverCoord(decoded[0]);
                setBearing(decoded.length > 1 ? getBearing(decoded[0], decoded[1]) : 0);
                setEtaLabel(`~${Math.ceil(leg.duration.value / 60)} min`);
            })
            .catch(err => { console.error('[TrackingMap] fetch error:', err); setRouteError(true); });
    }, [restaurantCoords, userCoords]);

    // ── 2. Move driver along route (out_for_delivery or mock pending animation) ─
    useEffect(() => {
        const shouldAnimate = isDelivering || isMockDriving;
        if (!shouldAnimate || route.length < 2) return;

        // Reset to start on each trigger
        setDriverIndex(0);
        setDriverCoord(route[0]);

        const totalSteps = route.length - 1;
        // Mock pending uses a fixed ~20s loop; real delivery uses totalMinutes
        const durationMs = isMockDriving ? 20_000 : totalMinutes * 60 * 1000;
        const stepMs = durationMs / totalSteps;
        let cur = 0;

        const iv = setInterval(() => {
            cur = Math.min(cur + 1, totalSteps);
            setDriverIndex(cur);
            const from = route[cur - 1] ?? route[0];
            const to = route[Math.min(cur, totalSteps)];
            let t = 0;
            const lerp = setInterval(() => {
                t = Math.min(t + 0.1, 1);
                setDriverCoord(lerpCoord(from, to, t));
                if (t >= 1) clearInterval(lerp);
            }, stepMs / 10);
            setBearing(getBearing(from, to));
            if (isDelivering) {
                const rem = Math.ceil(((totalSteps - cur) / totalSteps) * totalMinutes);
                setEtaLabel(rem > 0 ? `~${rem} min` : 'Arriving');
            }
            if (cur >= totalSteps) clearInterval(iv);
        }, stepMs);

        return () => clearInterval(iv);
    }, [route, isDelivering, isMockDriving, totalMinutes]);

    // ── 3. Camera fit ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || route.length < 2) return;
        setTimeout(() => {
            mapRef.current?.fitToCoordinates([restaurantCoords, userCoords], {
                edgePadding: { top: 100, right: 80, bottom: 120, left: 80 },
                animated: true,
            });
        }, 400);
    }, [route]);

    // ── Web fallback ────────────────────────────────────────────────────────
    if (Platform.OS === 'web') {
        return (
            <Box style={fillContainer ? styles.containerFill : styles.container}>
                <Text style={{ color: '#9CA3AF', alignSelf: 'center', marginTop: 120 }}>Map tracking available on mobile</Text>
            </Box>
        );
    }

    const midLat = (restaurantCoords.latitude + userCoords.latitude) / 2;
    const midLng = (restaurantCoords.longitude + userCoords.longitude) / 2;
    const latDelta = Math.max(Math.abs(restaurantCoords.latitude - userCoords.latitude) * 2, 0.02);
    const lngDelta = Math.max(Math.abs(restaurantCoords.longitude - userCoords.longitude) * 2, 0.02);

    // Driving animation active for either real delivery or mock pending
    const isDriving = isDelivering || isMockDriving;

    // Solid green behind the driver; dashed green ahead
    const traveledPath = isDriving ? route.slice(0, driverIndex + 1) : [];
    const remainingPath = isDriving ? route.slice(driverIndex) : route;

    // Moto: animate when driving, otherwise sit at route[1]
    const motoCoord = isDriving ? driverCoord : (route[Math.min(1, route.length - 1)] ?? restaurantCoords);
    const motoRotation = isDriving
        ? bearing
        : (route.length > 1 ? getBearing(route[0], route[Math.min(1, route.length - 1)]) : 0);

    return (
        <Box style={fillContainer ? styles.containerFill : styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={fillContainer ? styles.mapFill : styles.map}
                initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
                showsUserLocation={false}
                showsTraffic={false}
                toolbarEnabled={false}
            >
                {/* Green dashed path (remaining / animating in) */}
                {remainingPath.length > 1 && (
                    <Polyline
                        coordinates={remainingPath}
                        strokeColor="#06C167"
                        strokeWidth={4}
                        lineDashPattern={[10, 6]}
                    />
                )}

                {/* Solid green traveled path (out_for_delivery only) */}
                {traveledPath.length > 1 && (
                    <Polyline coordinates={traveledPath} strokeColor="#22c55e" strokeWidth={5} />
                )}

                {/* Fallback straight line if API failed */}
                {routeError && (
                    <Polyline
                        coordinates={[restaurantCoords, userCoords]}
                        strokeColor="#06C167" strokeWidth={4} lineDashPattern={[10, 6]}
                    />
                )}

                {/* Restaurant pin — always use child Image with fixed size to avoid Android release DPI scaling bug */}
                {(() => {
                    const filename = cuisineIcon?.split('/').pop() ?? '';
                    const asset = cuisineAssets[filename];
                    return (
                        <Marker
                            coordinate={restaurantCoords}
                            anchor={{ x: 0.5, y: 0.5 }}
                            tracksViewChanges={false}
                        >
                            {asset ? (
                                <Image
                                    source={asset}
                                    style={styles.cuisineIcon}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={styles.restaurantPin}>
                                    <Text style={{ fontSize: 18 }}>🍽️</Text>
                                </View>
                            )}
                        </Marker>
                    );
                })()}

                {/* User destination — red drop pin */}
                <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
                    <DropPin />
                </Marker>

                {/* Motorcycle — shown for all active statuses */}
                {showMoto && route.length > 1 && (
                    <Marker
                        coordinate={motoCoord}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                        rotation={motoRotation}
                        tracksViewChanges={false}
                    >
                        <Image
                            source={require('../assets/images/motorcycle-icon.png')}
                            style={styles.motoIcon}
                            resizeMode="contain"
                        />
                    </Marker>
                )}

                {/* ETA chip removed — shown in bottom sheet only, no floating marker needed */}

                {/* Pulsing destination ring */}
                <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
                    <PulsingPin />
                </Marker>
            </MapView>
        </Box>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { height: 300, borderRadius: 16, overflow: 'hidden' },
    containerFill: { flex: 1, overflow: 'hidden' },
    map: { width: width - 32, height: 300 },
    mapFill: { flex: 1, width: '100%' },
    motoIcon: { width: 52, height: 52 },
    cuisineIcon: { width: 44, height: 44 },
    restaurantPin: {
        backgroundColor: '#fff',
        borderRadius: 22,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
        borderWidth: 2,
        borderColor: '#06C167',
    },
    pinWrapper: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    pulseRing: {
        position: 'absolute',
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#EF4444',
    },
    pinDot: {
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: '#EF4444',
        borderWidth: 2, borderColor: '#fff',
    },
});
