import { Platform } from 'react-native';

// Native
export { useStripe, StripeProvider } from "@stripe/stripe-react-native";

// Web-only re-exports (only used on web via Platform checks)
// We stub them for native to avoid import errors
let useElements: any = () => null;
let CardElement: any = () => null;

if (Platform.OS === 'web') {
    const webStripe = require('@stripe/react-stripe-js');
    useElements = webStripe.useElements;
    CardElement = webStripe.CardElement;
}

export { useElements, CardElement };
