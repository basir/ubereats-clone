import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { Category } from '../types';
import { router } from 'expo-router';

interface CategoryListProps {
    categories: Category[];
}

export const CategoryList = ({ categories }: CategoryListProps) => {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>

            {categories.map((category) => (
                <Pressable key={category.id} onPress={() => router.push({ pathname: '/search', params: { categoryId: category.id } })}>
                    <VStack className="items-center mr-4 gap-1">
                        <Box className="bg-white p-2 rounded-full shadow-sm">
                            <Image
                                source={{ uri: category.image }}
                                alt={category.name}
                                className="h-[50px] w-[50px] rounded-full"
                            />
                        </Box>
                        <Text className="text-xs font-heading">{category.name}</Text>
                    </VStack>
                </Pressable>
            ))}
        </ScrollView>
    );
};
