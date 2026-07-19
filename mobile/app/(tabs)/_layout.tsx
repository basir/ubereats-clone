import { Tabs } from 'expo-router';
import { Text, Animated, ColorValue } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Home, Search, ShoppingBag, User } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useRef } from 'react';

function AnimatedTabIcon({ IconComp, color, focused }: { IconComp: any; color: ColorValue; focused: boolean }) {
    const scale = useRef(new Animated.Value(1)).current;

    const prevFocused = useRef(focused);
    if (prevFocused.current !== focused) {
        prevFocused.current = focused;
        if (focused) {
            Animated.sequence([
                Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 14 }),
            ]).start();
        }
    }

    return (
        <Animated.View style={{ transform: [{ scale }], width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Icon as={IconComp} color={color as string} size="xl" style={{ width: 28, height: 28 }} />
        </Animated.View>
    );
}

function AnimatedCartIcon({ color, focused, itemCount }: { color: ColorValue; focused: boolean; itemCount: number }) {
    const iconScale = useRef(new Animated.Value(1)).current;
    const badgeScale = useRef(new Animated.Value(itemCount > 0 ? 1 : 0)).current;
    const prevCount = useRef(itemCount);

    const prevFocused = useRef(focused);
    if (prevFocused.current !== focused) {
        prevFocused.current = focused;
        if (focused) {
            Animated.sequence([
                Animated.timing(iconScale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
                Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 14 }),
            ]).start();
        }
    }

    if (prevCount.current !== itemCount) {
        prevCount.current = itemCount;
        if (itemCount > 0) {
            Animated.sequence([
                Animated.spring(badgeScale, { toValue: 1.5, useNativeDriver: true, speed: 30, bounciness: 10 }),
                Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
            ]).start();
        } else {
            Animated.timing(badgeScale, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        }
    }

    return (
        <Animated.View style={{ transform: [{ scale: iconScale }], width: 28, height: 28 }}>
            <Icon as={ShoppingBag} color={color as string} size="xl" style={{ width: 28, height: 28 }} />
            {itemCount > 0 && (
                <Animated.View style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#06C167',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                    transform: [{ scale: badgeScale }],
                }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', lineHeight: 12 }}>
                        {itemCount > 99 ? '99+' : itemCount}
                    </Text>
                </Animated.View>
            )}
        </Animated.View>
    );
}

export default function TabLayout() {
    const { itemCount } = useCart();

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#06C167',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarShowLabel: false,
                tabBarStyle: { borderTopColor: '#F3F4F6' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon IconComp={Home} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon IconComp={Search} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedCartIcon color={color} focused={focused} itemCount={itemCount} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon IconComp={User} color={color} focused={focused} />
                    ),
                }}
            />
            {/* Hidden tabs */}
            <Tabs.Screen name="categories" options={{ href: null }} />
            <Tabs.Screen name="product" options={{ href: null }} />
            <Tabs.Screen name="product/[id]" options={{ href: null }} />
        </Tabs>
    );
}
