import React, { ReactElement } from 'react';
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';

// Stripe publishable key from environment variable
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface Props {
  children: ReactElement;
  // Optional merchant identifier for Apple Pay
  merchantIdentifier?: string;
}

/**
 * Stripe Provider wrapper for the application
 * Provides Stripe context to all child components
 */
export function StripeProvider({ children, merchantIdentifier }: Props) {
  // Skip if no Stripe key is configured
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured - Stripe features will be disabled');
    return children;
  }

  return (
    <NativeStripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={merchantIdentifier || 'merchant.com.sharetips'}
      urlScheme="sharetips"
    >
      {children}
    </NativeStripeProvider>
  );
}

export default StripeProvider;
