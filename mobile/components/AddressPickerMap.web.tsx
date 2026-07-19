import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import * as ExpoLocation from 'expo-location';

interface AddressPickerMapProps {
    initialCoords: { latitude: number; longitude: number };
    onLocationSelected: (coords: { latitude: number; longitude: number; address: string }) => void;
    onClose: () => void;
}

export const AddressPickerMap = ({ initialCoords, onLocationSelected, onClose }: AddressPickerMapProps) => {
    const insets = useSafeAreaInsets();
    const [coords, setCoords] = useState(initialCoords);
    const [resolving, setResolving] = useState(false);

    // OSM iframe centered on current coords
    const osmUrl =
        `https://www.openstreetmap.org/export/embed.html` +
        `?bbox=${coords.longitude - 0.025},${coords.latitude - 0.025},${coords.longitude + 0.025},${coords.latitude + 0.025}` +
        `&layer=mapnik` +
        `&marker=${coords.latitude},${coords.longitude}`;

    const handleConfirm = async () => {
        setResolving(true);
        try {
            const geocoded = await ExpoLocation.reverseGeocodeAsync(coords);
            const place = geocoded[0];
            const address = [place.streetNumber, place.street, place.city, place.region]
                .filter(Boolean)
                .join(', ');
            onLocationSelected({ ...coords, address: address || 'Selected Location' });
        } catch {
            onLocationSelected({ ...coords, address: 'Selected Location' });
        } finally {
            setResolving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Green status bar fill */}
            <View style={{ height: insets.top, backgroundColor: '#06C167' }} />

            <View style={{ flex: 1, position: 'relative' }}>
                {/* @ts-ignore */}
                <iframe
                    src={osmUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Address Picker Map"
                />

                <Pressable style={styles.closeBtn} onPress={onClose}>
                    <Box className="bg-white rounded-full p-2 shadow">
                        <Icon as={X} style={{ width: 20, height: 20 }} />
                    </Box>
                </Pressable>

                <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
                    <Box className="bg-white p-4 rounded-2xl shadow-lg mx-4">
                        <Text className="text-sm text-gray-500 mb-1">
                            Deliver to: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                        </Text>
                        <Button
                            className="bg-green-500 rounded-xl"
                            onPress={handleConfirm}
                            isDisabled={resolving}
                        >
                            <ButtonText className="text-white font-heading">
                                {resolving ? 'Confirming...' : 'Confirm Location'}
                            </ButtonText>
                        </Button>
                    </Box>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    closeBtn: { position: 'absolute', top: 16, right: 16 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
