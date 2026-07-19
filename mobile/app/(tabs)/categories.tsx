// This tab is hidden via href: null in _layout.tsx
// Redirects to home
import { Redirect } from 'expo-router';
export default function CategoriesRedirect() {
    return <Redirect href="/(tabs)" />;
}
