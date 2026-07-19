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
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
    const [name, setName] = useState('Demo User');
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const { register } = useAuth();

    const handleRegister = async () => {
        try {
            setError('');
            if (!name || !email || !password) {
                setError('Please fill in all fields');
                return;
            }
            await register({ name, email, password });
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#06C167' }}>
                <SafeAreaView edges={['top']}>
                    <Box className="px-4 py-4">
                        <Heading className="text-white text-2xl font-heading">Uber Eats</Heading>
                        <Text className="text-white opacity-90 text-sm mt-1">Create a new account</Text>
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
                                <FormControlLabelText>Your name</FormControlLabelText>
                            </FormControlLabel>
                            <Input size="lg">
                                <InputField value={name} onChangeText={setName} placeholder="First and last name" />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel>
                                <FormControlLabelText>Mobile number or email</FormControlLabelText>
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
                                    placeholder="At least 6 characters"
                                />
                            </Input>
                            <Text className="text-xs text-gray-500 mt-1">Passwords must be at least 6 characters.</Text>
                        </FormControl>

                        <Button onPress={handleRegister} className="bg-green-500 mt-2" size="lg">
                            <ButtonText className="text-white font-heading">Create Account</ButtonText>
                        </Button>
                    </VStack>

                    <Box className="flex-row items-center justify-center mt-2">
                        <Text className="text-sm text-gray-600">Already have an account? </Text>
                        <Button variant="link" size="sm" onPress={() => router.back()} className="p-0">
                            <ButtonText className="text-green-500">Sign in</ButtonText>
                        </Button>
                    </Box>
                </VStack>
            </Box>
        </View>
    );
}
