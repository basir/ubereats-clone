// Legacy route - redirects to restaurant screen
import { Redirect, useLocalSearchParams } from 'expo-router';
export default function LegacyProductRedirect() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <Redirect href={`/restaurant/${id}` as any} />;
}
