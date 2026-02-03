import React, { ReactElement, createContext, useContext } from 'react';

// Stripe publishable key from environment variable
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface Props {
  children: ReactElement;
  merchantIdentifier?: string;
}

// Context to track if Stripe is available
const StripeAvailableContext = createContext<boolean>(false);

export const useStripeAvailable = () => useContext(StripeAvailableContext);

// Check if native Stripe module is available
let StripeNativeProvider: React.ComponentType<{
  publishableKey: string;
  merchantIdentifier?: string;
  urlScheme?: string;
  children: React.ReactNode;
}> | null = null;

let stripeAvailable = false;

try {
  // Try to import the native Stripe provider
  // This will throw if native modules aren't available (Expo Go)
  const stripe = require('@stripe/stripe-react-native');
  StripeNativeProvider = stripe.StripeProvider;
  stripeAvailable = true;
} catch {
  console.warn(
    '[StripeProvider] Native Stripe module not available. ' +
    'Payment features will be disabled. ' +
    'Use a development build for full Stripe support.'
  );
}

/**
 * Stripe Provider wrapper for the application
 * Gracefully degrades when native modules aren't available (Expo Go)
 */
export function StripeProvider({ children, merchantIdentifier }: Props) {
  // If no key or native module not available, just render children
  if (!STRIPE_PUBLISHABLE_KEY || !StripeNativeProvider) {
    return (
      <StripeAvailableContext.Provider value={false}>
        {children}
      </StripeAvailableContext.Provider>
    );
  }

  return (
    <StripeAvailableContext.Provider value={true}>
      <StripeNativeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier={merchantIdentifier || 'merchant.com.sharetips'}
        urlScheme="sharetips"
      >
        {children}
      </StripeNativeProvider>
    </StripeAvailableContext.Provider>
  );
}

// Export whether Stripe is available for use in other components
export const isStripeAvailable = stripeAvailable;

export default StripeProvider;
