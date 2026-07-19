import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Restaurant } from '../types';

interface Props {
    restaurants: Restaurant[];
    userCoords: { latitude: number; longitude: number };
}

const MapRestaurantsView: React.FC<Props> = ({ restaurants, userCoords }) => {
    const osmUrl =
        `https://www.openstreetmap.org/export/embed.html` +
        `?bbox=${userCoords.longitude - 0.05},${userCoords.latitude - 0.05},${userCoords.longitude + 0.05},${userCoords.latitude + 0.05}` +
        `&layer=mapnik` +
        `&marker=${userCoords.latitude},${userCoords.longitude}`;

    return (
        <View style={styles.container}>
            {/* @ts-ignore */}
            <iframe
                src={osmUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Restaurants Map"
            />
            <Box style={styles.badge}>
                <Text style={styles.badgeText}>{restaurants.length} restaurants nearby</Text>
            </Box>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative' },
    badge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    badgeText: { fontSize: 13, fontWeight: '600', color: '#333' },
});

export default MapRestaurantsView;
