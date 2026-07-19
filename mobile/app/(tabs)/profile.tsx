import React, { useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Divider } from "@/components/ui/divider";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Package, MapPin, Heart, LogOut, ChevronRight, CreditCard } from 'lucide-react-native';
import { LastOrderStatus } from '@/components/LastOrderStatus';

export default function ProfileScreen() {
    const { user, logout, isAuthenticated } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const onRefresh = () => {
        setRefreshing(true);
        setRefreshKey(k => k + 1);
        setTimeout(() => setRefreshing(false), 800);
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    if (!isAuthenticated) {
        return (
            <Box className="flex-1 bg-white">
                <View style={{ backgroundColor: '#06C167' }}>
                    <SafeAreaView edges={['top']}>
                        <Box className="px-4 py-3">
                            <Text className="text-white text-lg font-heading">Account</Text>
                        </Box>
                    </SafeAreaView>
                </View>
                <Box className="flex-1 justify-center items-center p-6">
                    <Heading className="text-xl mb-2">Welcome</Heading>
                    <Text className="mb-6 text-center text-gray-500">Sign in to view orders, addresses, and more.</Text>
                    <Button onPress={() => router.push('/(auth)/login')} className="bg-green-500 w-full rounded-xl">
                        <ButtonText className="text-white">Sign In</ButtonText>
                    </Button>
                </Box>
            </Box>
        );
    }

    const menuItems = [
        { icon: Package, label: 'Your Orders', route: '/orders' },
        { icon: Heart, label: 'Saved Restaurants', route: '/saved-restaurants' },
        { icon: MapPin, label: 'Delivery Addresses', route: '/delivery-addresses' },
    ];

    return (
        <Box className="flex-1 bg-gray-50">
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <Box className="px-4 py-3">
                        <Text className="text-white text-lg font-heading">Account</Text>
                    </Box>
                </SafeAreaView>
            </View>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06C167" />}>
                <Box className="bg-white p-4 mb-2">
                    <HStack className="gap-4 items-center">
                        <Avatar className="bg-green-100" size="lg">
                            <AvatarFallbackText>{user?.name}</AvatarFallbackText>
                        </Avatar>
                        <VStack>
                            <Text className="text-lg font-heading">{user?.name}</Text>
                            <Text className="text-gray-500 text-sm">{user?.email}</Text>
                        </VStack>
                    </HStack>
                </Box>

                {user?.id && <LastOrderStatus userId={user.id} refresh={refreshKey} />}

                <Box className="bg-white px-4 py-2 mb-2">
                    <VStack>
                        {menuItems.map((item, index) => (
                            <React.Fragment key={index}>
                                <Pressable
                                    onPress={() => router.push(item.route as any)}
                                    className="py-4"
                                >
                                    <HStack className="justify-between items-center">
                                        <HStack className="gap-3 items-center">
                                            <Icon as={item.icon} className="text-gray-500" style={{ width: 20, height: 20 }} />
                                            <Text className="text-base">{item.label}</Text>
                                        </HStack>
                                        <Icon as={ChevronRight} className="text-gray-300" style={{ width: 18, height: 18 }} />
                                    </HStack>
                                </Pressable>
                                {index < menuItems.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </VStack>
                </Box>

                <Box className="p-4">
                    <Button variant="outline" onPress={handleLogout} className="border-red-200 rounded-xl">
                        <HStack className="gap-2 items-center">
                            <Icon as={LogOut} className="text-red-500" style={{ width: 18, height: 18 }} />
                            <ButtonText className="text-red-500">Sign Out</ButtonText>
                        </HStack>
                    </Button>
                </Box>
            </ScrollView>
        </Box>
    );
}
