import React, { useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, MapPin, Trash2, Plus, Check } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types';
import { EmptyState } from '@/components/EmptyState';

function generateId() {
    return Math.random().toString(36).slice(2, 10);
}

const EMPTY_FORM: Omit<Address, 'id'> = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: 0,
    longitude: 0,
    isDefault: false,
};

export default function DeliveryAddressesScreen() {
    const { user, updateUser } = useAuth();
    const addresses: Address[] = user?.addresses ?? [];

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Omit<Address, 'id'>>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!form.street.trim() || !form.city.trim()) {
            Alert.alert('Missing info', 'Please enter at least a street and city.');
            return;
        }
        setSaving(true);
        const newAddress: Address = {
            ...form,
            id: generateId(),
            isDefault: addresses.length === 0,
        };
        await updateUser({ addresses: [...addresses, newAddress] });
        setForm(EMPTY_FORM);
        setShowForm(false);
        setSaving(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Remove address', 'Remove this delivery address?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive',
                onPress: async () => {
                    const updated = addresses.filter(a => a.id !== id);
                    // if we removed the default, set first as default
                    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
                        updated[0].isDefault = true;
                    }
                    await updateUser({ addresses: updated });
                },
            },
        ]);
    };

    const handleSetDefault = async (id: string) => {
        const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
        await updateUser({ addresses: updated });
    };

    const header = (
        <View style={{ backgroundColor: '#06C167' }}>
            <SafeAreaView edges={['top']}>
                <HStack className="px-4 py-3 items-center gap-3">
                    <Pressable onPress={() => router.back()} hitSlop={8}>
                        <Icon as={ChevronLeft} className="text-white" style={{ width: 24, height: 24 }} />
                    </Pressable>
                    <Text className="text-white text-lg font-heading">Delivery Addresses</Text>
                </HStack>
            </SafeAreaView>
        </View>
    );

    return (
        <Box className="flex-1 bg-gray-50">
            {header}
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {addresses.length === 0 && !showForm && (
                    <Box className="mb-4">
                        <EmptyState
                            icon={MapPin}
                            title="No addresses saved"
                            message="Add a delivery address to speed up checkout."
                        />
                    </Box>
                )}

                {addresses.map(address => (
                    <Box key={address.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                        <HStack className="justify-between items-start">
                            <HStack className="flex-1 gap-3 items-start">
                                <Box className="mt-0.5 w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                                    <Icon as={MapPin} className="text-green-500" style={{ width: 16, height: 16 }} />
                                </Box>
                                <VStack className="flex-1">
                                    <Text className="font-heading text-sm">{address.street}</Text>
                                    <Text className="text-gray-500 text-xs mt-0.5">
                                        {[address.city, address.state, address.zipCode, address.country].filter(Boolean).join(', ')}
                                    </Text>
                                    {address.isDefault && (
                                        <HStack className="items-center gap-1 mt-1">
                                            <Icon as={Check} className="text-green-500" style={{ width: 12, height: 12 }} />
                                            <Text className="text-green-600 text-xs">Default</Text>
                                        </HStack>
                                    )}
                                </VStack>
                            </HStack>
                            <HStack className="gap-2 items-center">
                                {!address.isDefault && (
                                    <Pressable onPress={() => handleSetDefault(address.id)} hitSlop={8}>
                                        <Text className="text-green-600 text-xs font-heading">Set default</Text>
                                    </Pressable>
                                )}
                                <Pressable onPress={() => handleDelete(address.id)} hitSlop={8} className="p-1.5 rounded-full bg-red-50">
                                    <Icon as={Trash2} className="text-red-400" style={{ width: 15, height: 15 }} />
                                </Pressable>
                            </HStack>
                        </HStack>
                    </Box>
                ))}

                {showForm ? (
                    <Box className="bg-white rounded-xl p-4 shadow-sm mb-3">
                        <Text className="font-heading text-sm mb-3">New Address</Text>
                        <VStack className="gap-3">
                            <Input className="rounded-xl bg-gray-50 border-gray-200">
                                <InputField
                                    placeholder="Street address"
                                    value={form.street}
                                    onChangeText={v => setForm(f => ({ ...f, street: v }))}
                                />
                            </Input>
                            <HStack className="gap-2">
                                <Box className="flex-1">
                                    <Input className="rounded-xl bg-gray-50 border-gray-200">
                                        <InputField
                                            placeholder="City"
                                            value={form.city}
                                            onChangeText={v => setForm(f => ({ ...f, city: v }))}
                                        />
                                    </Input>
                                </Box>
                                <Box className="flex-1">
                                    <Input className="rounded-xl bg-gray-50 border-gray-200">
                                        <InputField
                                            placeholder="State"
                                            value={form.state}
                                            onChangeText={v => setForm(f => ({ ...f, state: v }))}
                                        />
                                    </Input>
                                </Box>
                            </HStack>
                            <HStack className="gap-2">
                                <Box className="flex-1">
                                    <Input className="rounded-xl bg-gray-50 border-gray-200">
                                        <InputField
                                            placeholder="Zip code"
                                            value={form.zipCode}
                                            onChangeText={v => setForm(f => ({ ...f, zipCode: v }))}
                                        />
                                    </Input>
                                </Box>
                                <Box className="flex-1">
                                    <Input className="rounded-xl bg-gray-50 border-gray-200">
                                        <InputField
                                            placeholder="Country"
                                            value={form.country}
                                            onChangeText={v => setForm(f => ({ ...f, country: v }))}
                                        />
                                    </Input>
                                </Box>
                            </HStack>
                            <HStack className="gap-2 mt-1">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl border-gray-200"
                                    onPress={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                                >
                                    <ButtonText className="text-gray-500">Cancel</ButtonText>
                                </Button>
                                <Button
                                    className="flex-1 rounded-xl bg-green-500"
                                    onPress={handleAdd}
                                    isDisabled={saving}
                                >
                                    <ButtonText className="text-white">{saving ? 'Saving...' : 'Save'}</ButtonText>
                                </Button>
                            </HStack>
                        </VStack>
                    </Box>
                ) : (
                    <Pressable
                        onPress={() => setShowForm(true)}
                        className="flex-row items-center gap-2 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-dashed border-gray-200"
                    >
                        <Icon as={Plus} className="text-green-500" style={{ width: 18, height: 18 }} />
                        <Text className="text-green-600 font-heading text-sm">Add new address</Text>
                    </Pressable>
                )}
            </ScrollView>
        </Box>
    );
}
