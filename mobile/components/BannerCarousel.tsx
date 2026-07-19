import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { Box } from "@/components/ui/box";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { Banner } from '../types';
import { router } from 'expo-router';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

interface BannerCarouselProps {
    banners: Banner[];
}

export const BannerCarousel = ({ banners }: BannerCarouselProps) => {
    const scrollRef = useRef<ScrollView>(null);
    let index = 0;

    useEffect(() => {
        const timer = setInterval(() => {
            index = (index + 1) % banners.length;
            scrollRef.current?.scrollTo({ x: width * index, animated: true });
        }, 3000);
        return () => clearInterval(timer);
    }, []);
    return (
        <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {banners.map(banner => (
                <Pressable key={banner.id} onPress={() => router.push(banner.link as any)}>
                    <Box style={{ width, height: 200 }}>
                        <Image
                            source={{ uri: banner.image }}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                        />
                    </Box>
                </Pressable>
            ))}
        </ScrollView>
    );
};
