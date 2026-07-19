import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import '@/global.css';
import { Stack } from "expo-router";
import { LogBox, Text, TextInput } from 'react-native';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, CartProvider, WishlistProvider, LocationProvider } from "../context";
import * as Linking from 'expo-linking';
import { StripeProvider } from "@/utils/stripe";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

// Override default font for all Text and TextInput components
const defaultTextStyle = { fontFamily: 'Nunito-Regular' };
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.style = defaultTextStyle;
(TextInput as any).defaultProps = (TextInput as any).defaultProps ?? {};
(TextInput as any).defaultProps.style = defaultTextStyle;

export default function RootLayout() {
    const urlScheme = Linking.createURL('/');

    const [fontsLoaded] = useFonts({
        'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
        'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <StripeProvider
                publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
                urlScheme={urlScheme}
            >
                <GluestackUIProvider mode="light">
                    <AuthProvider>
                        <LocationProvider>
                            <CartProvider>
                                <WishlistProvider>
                                    <Stack>
                                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                        <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
                                        <Stack.Screen name="checkout" options={{ headerShown: false }} />
                                        <Stack.Screen name="orders/index" options={{ headerShown: false }} />
                                        <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
                                        <Stack.Screen name="saved-restaurants" options={{ headerShown: false }} />
                                        <Stack.Screen name="delivery-addresses" options={{ headerShown: false }} />
                                    </Stack>
                                </WishlistProvider>
                            </CartProvider>
                        </LocationProvider>
                    </AuthProvider>
                </GluestackUIProvider>
            </StripeProvider>
        </SafeAreaProvider>
    );
}

