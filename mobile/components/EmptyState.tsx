import React from 'react';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    showHomeButton?: boolean;
}

export const EmptyState = ({
    icon,
    title,
    message,
    actionLabel,
    onAction,
    showHomeButton = true
}: EmptyStateProps) => {
    return (
        <Box className="flex-1 justify-center items-center p-8">
            <VStack className="gap-4 items-center">
                <Box className="bg-gray-100 p-6 rounded-full">
                    <Icon as={icon} className="w-10 h-10 text-gray-400" />
                </Box>
                <Text className="text-xl font-heading text-center" numberOfLines={1}>{title}</Text>
                <Text className="text-gray-500 text-center">{message}</Text>

                {actionLabel && onAction && (
                    <Button onPress={onAction} className="mt-4 bg-green-500">
                        <ButtonText className='text-white'>{actionLabel}</ButtonText>
                    </Button>
                )}

                {showHomeButton && !actionLabel && (
                    <Button onPress={() => router.push('/(tabs)')} className="mt-4 bg-green-500" variant="outline">
                        <ButtonText  className="text-white">Continue Shopping</ButtonText>
                    </Button>
                )}
            </VStack>
        </Box>
    );
};
