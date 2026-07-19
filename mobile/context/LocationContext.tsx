import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLocation from 'expo-location';

// ─── Mock location config ───────────────────────────────────────────────────
// Set USE_MOCK_LOC to true to skip GPS and use the coords below instead.
// Placed near the Taco Town restaurant: "latitude": 47.6012, "longitude": -122.3358
const USE_MOCK_LOC = true;  
const MOCK_LOCATION = { latitude: 47.60746374819052, longitude: -122.33211915058678, address: '213 Cherry St, Seattle, WA' };
// ────────────────────────────────────────────────────────────────────────────

const LOCATION_KEY = '@delivery_location';

interface DeliveryLocation {
    latitude: number;
    longitude: number;
    address: string;
}

interface LocationContextType {
    deliveryLocation: DeliveryLocation | null;
    setDeliveryLocation: (loc: DeliveryLocation) => Promise<void>;
    requestCurrentLocation: () => Promise<DeliveryLocation | null>;
    isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [deliveryLocation, setDeliveryLocationState] = useState<DeliveryLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(LOCATION_KEY).then(stored => {
            if (stored) {
                setDeliveryLocationState(JSON.parse(stored));
            } else if (USE_MOCK_LOC) {
                // No saved location yet — use mock as default (won't override user changes)
                setDeliveryLocationState(MOCK_LOCATION);
            }
            setIsLoading(false);
        });
    }, []);

    const setDeliveryLocation = async (loc: DeliveryLocation) => {
        setDeliveryLocationState(loc);
        await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    };

    const requestCurrentLocation = async (): Promise<DeliveryLocation | null> => {
        if (USE_MOCK_LOC) return deliveryLocation; // already set, nothing to do
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;

            const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
            const { latitude, longitude } = loc.coords;

            // Reverse geocode
            const geocoded = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
            const place = geocoded[0];
            const address = [place.streetNumber, place.street, place.city, place.region]
                .filter(Boolean)
                .join(', ');

            const result: DeliveryLocation = { latitude, longitude, address: address || 'Current Location' };
            await setDeliveryLocation(result);
            return result;
        } catch {
            return null;
        }
    };

    return (
        <LocationContext.Provider value={{ deliveryLocation, setDeliveryLocation, requestCurrentLocation, isLoading }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
    return ctx;
};
