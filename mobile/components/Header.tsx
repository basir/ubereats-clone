import React from 'react';
import { View } from 'react-native';
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';

interface HeaderProps {
    onAddressPress?: () => void;
}

export const Header = ({ onAddressPress }: HeaderProps) => {
    const pathname = usePathname();
    const { deliveryLocation } = useLocation();

    const addressLabel = deliveryLocation
        ? deliveryLocation.address.split(',')[0]
        : 'Set delivery location';

    return (
        <View style={{ backgroundColor: '#06C167' }}>
            <SafeAreaView edges={['top']}>
                <Box className="px-4 py-3 flex flex-row items-center gap-3">
                    {pathname !== '/' && pathname !== '/(tabs)' && (
                        <Pressable onPress={() => router.back()}>
                            <Icon as={ArrowLeft} size="xl" className="text-white" style={{ width: 28, height: 28 }} />
                        </Pressable>
                    )}
                    <Pressable
                        className="flex-1 flex-row items-center gap-1"
                        onPress={onAddressPress}
                    >
                        <Icon as={MapPin} className="text-white" style={{ width: 18, height: 18 }} />
                        <Text className="text-white font-heading text-base flex-1" numberOfLines={1}>
                            {addressLabel}
                        </Text>
                        <Icon as={ChevronDown} className="text-white" style={{ width: 18, height: 18 }} />
                    </Pressable>
                </Box>
            </SafeAreaView>
        </View>
    );
};
