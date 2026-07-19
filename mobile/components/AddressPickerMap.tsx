import React, { useState } from 'react';
import { StyleSheet, View, Platform, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import * as ExpoLocation from 'expo-location';

// react-native-maps is only available on native
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface AddressPickerMapProps {
    initialCoords: { latitude: number; longitude: number };
    onLocationSelected: (coords: { latitude: number; longitude: number; address: string }) => void;
    onClose: () => void;
}

export const AddressPickerMap = ({ initialCoords, onLocationSelected, onClose }: AddressPickerMapProps) => {
    const insets = useSafeAreaInsets();
    const [region, setRegion] = useState({
        ...initialCoords,
        latitudeDelta: 0.00922,
        longitudeDelta: 0.00421,
    });
    const [resolving, setResolving] = useState(false);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

    const handleConfirm = async () => {
        setResolving(true);
        try {
            const geocoded = await ExpoLocation.reverseGeocodeAsync({
                latitude: region.latitude,
                longitude: region.longitude,
            });
            const place = geocoded[0];
            const address = [place.streetNumber, place.street, place.city, place.region]
                .filter(Boolean)
                .join(', ');
            onLocationSelected({
                latitude: region.latitude,
                longitude: region.longitude,
                address: address || 'Selected Location',
            });
        } catch {
            onLocationSelected({ latitude: region.latitude, longitude: region.longitude, address: 'Selected Location' });
        } finally {
            setResolving(false);
        }
    };

    if (Platform.OS === 'web') {
        return (
            <Box className="flex-1 justify-center items-center p-6">
                <Text className="text-gray-500 mb-4">Map picker is available on mobile only.</Text>
                <Button onPress={onClose}><ButtonText>Close</ButtonText></Button>
            </Box>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Green status bar fill matching the app header */}
            <View style={{ height: insets.top, backgroundColor: '#06C167' }} />

            <View
                style={{ flex: 1 }}
                onLayout={(e: LayoutChangeEvent) => {
                    const { width, height } = e.nativeEvent.layout;
                    setContainerSize({ width, height });
                }}
            >
                {containerSize && (
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ width: containerSize.width, height: containerSize.height, position: 'absolute' }}
                        initialRegion={region}
                        onRegionChangeComplete={(r: typeof region) => setRegion(r)}
                    />
                )}
                {!containerSize && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text className="text-gray-400">Loading map...</Text>
                    </View>
                )}

                {/* Fixed center pin */}
                <View style={styles.pinContainer} pointerEvents="none">
                    <View style={styles.pin} />
                    <View style={styles.pinTail} />
                </View>

                {/* Close button — sits just below the green top bar */}
                <Pressable style={styles.closeBtn} onPress={onClose}>
                    <Box className="bg-white rounded-full p-2 shadow">
                        <Icon as={X} style={{ width: 20, height: 20 }} />
                    </Box>
                </Pressable>

                {/* Confirm button — respects home indicator */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
                    <Box className="bg-white p-4 rounded-2xl shadow-lg mx-4">
                        <Text className="text-sm text-gray-500 mb-1">Deliver to pin location</Text>
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
    pinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        alignItems: 'center',
        marginLeft: -12,
        marginTop: -32,
    },
    pin: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#06C167',
        borderWidth: 3,
        borderColor: 'white',
    },
    pinTail: {
        width: 2,
        height: 10,
        backgroundColor: '#06C167',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});
