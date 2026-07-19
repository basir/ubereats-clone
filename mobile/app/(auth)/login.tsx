import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Divider } from '@/components/ui/divider';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { redirect } = useLocalSearchParams();

    const handleLogin = async () => {
        try {
            setError('');
            await login(email, password);
            if (redirect === 'checkout') {
                router.replace('/checkout');
            } else {
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <Box className="px-4 py-4">
                        <Heading className="text-white text-2xl font-heading">Uber Eats</Heading>
                        <Text className="text-white opacity-90 text-sm mt-1">Sign in to your account</Text>
                    </Box>
                </SafeAreaView>
            </View>

            <Box className="flex-1 p-6">
                <VStack className="gap-6">
                    {error ? (
                        <Box className="bg-red-100 p-3 rounded-md">
                            <Text className="text-red-600">{error}</Text>
                        </Box>
                    ) : null}

                    <VStack className="gap-4">
                        <FormControl>
                            <FormControlLabel>
                                <FormControlLabelText>Email or mobile phone number</FormControlLabelText>
                            </FormControlLabel>
                            <Input size="lg">
                                <InputField
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel>
                                <FormControlLabelText>Password</FormControlLabelText>
                            </FormControlLabel>
                            <Input size="lg">
                                <InputField
                                    value={password}
                                    onChangeText={setPassword}
                                    type="password"
                                />
                            </Input>
                        </FormControl>

                        <Button onPress={handleLogin} className="bg-green-500 mt-2" size="lg">
                            <ButtonText className="text-white font-heading">Sign In</ButtonText>
                        </Button>
                    </VStack>

                    <HStack className="items-center gap-3">
                        <Divider className="flex-1" />
                        <Text className="text-gray-400 text-xs">New to Uber Eats?</Text>
                        <Divider className="flex-1" />
                    </HStack>

                    <Button
                        variant="outline"
                        className="border-gray-300"
                        size="lg"
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <ButtonText className="text-black">Create your Uber Eats account</ButtonText>
                    </Button>
                </VStack>
            </Box>
        </View>
    );
}
