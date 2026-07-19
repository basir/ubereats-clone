import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface TrackingMapProps {
    restaurantCoords: { latitude: number; longitude: number };
    userCoords: { latitude: number; longitude: number };
    orderStatus: string;
}

export const OrderTrackingMap = ({ restaurantCoords, userCoords, orderStatus }: TrackingMapProps) => {
    const [driverLocation, setDriverLocation] = useState(restaurantCoords);

    useEffect(() => {
        if (orderStatus !== 'out_for_delivery') {
            setDriverLocation(restaurantCoords);
            return;
        }

        let progress = 0;
        const interval = setInterval(() => {
            progress = Math.min(progress + 0.05, 1);
            const lat = restaurantCoords.latitude + (userCoords.latitude - restaurantCoords.latitude) * progress;
            const lng = restaurantCoords.longitude + (userCoords.longitude - restaurantCoords.longitude) * progress;
            setDriverLocation({ latitude: lat, longitude: lng });
            if (progress >= 1) clearInterval(interval);
        }, 3000);

        return () => clearInterval(interval);
    }, [orderStatus, restaurantCoords, userCoords]);

    // Center between restaurant and user
    const midLat = (restaurantCoords.latitude + userCoords.latitude) / 2;
    const midLng = (restaurantCoords.longitude + userCoords.longitude) / 2;

    // Build OpenStreetMap embed URL with markers
    const markers = [
        `${restaurantCoords.latitude},${restaurantCoords.longitude}`, // restaurant
        `${userCoords.latitude},${userCoords.longitude}`,             // user
    ];
    if (orderStatus === 'out_for_delivery') {
        markers.push(`${driverLocation.latitude},${driverLocation.longitude}`);
    }

    // Use OSM iframe — works without any API key
    const osmUrl =
        `https://www.openstreetmap.org/export/embed.html` +
        `?bbox=${midLng - 0.05},${midLat - 0.05},${midLng + 0.05},${midLat + 0.05}` +
        `&layer=mapnik` +
        `&marker=${midLat},${midLng}`;

    return (
        <View style={styles.container}>
            {/* @ts-ignore — iframe is valid on web */}
            <iframe
                src={osmUrl}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
                title="Order Tracking Map"
            />
            <Box style={styles.legend}>
                <Text style={styles.legendText}>🟢 Restaurant</Text>
                <Text style={styles.legendText}>🔵 Your Address</Text>
                {orderStatus === 'out_for_delivery' && (
                    <Text style={styles.legendText}>🔴 Courier</Text>
                )}
            </Box>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 280,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    legend: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 8,
        gap: 2,
    },
    legendText: {
        fontSize: 11,
        color: '#333',
    },
});
