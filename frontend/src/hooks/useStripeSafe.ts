import { Alert } from 'react-native';
import { isStripeAvailable } from '../providers/StripeProvider';

// Types for Stripe hook return values
interface PaymentSheetError {
  code: string;
  message: string;
}

interface PaymentSheetResult {
  error?: PaymentSheetError;
}

interface InitPaymentSheetParams {
  paymentIntentClientSecret: string;
  merchantDisplayName: string;
  customerId?: string;
  customerEphemeralKeySecret?: string;
}

interface UseStripeReturn {
  initPaymentSheet: (params: InitPaymentSheetParams) => Promise<PaymentSheetResult>;
  presentPaymentSheet: () => Promise<PaymentSheetResult>;
}

// Mock implementation when Stripe isn't available
const mockStripe: UseStripeReturn = {
  initPaymentSheet: async () => {
    Alert.alert(
      'Paiement indisponible',
      'Les paiements Stripe ne sont pas disponibles dans Expo Go. ' +
      'Utilisez un Development Build pour tester les paiements.'
    );
    return { error: { code: 'Unavailable', message: 'Stripe not available in Expo Go' } };
  },
  presentPaymentSheet: async () => {
    return { error: { code: 'Unavailable', message: 'Stripe not available in Expo Go' } };
  },
};

// Get the real useStripe hook if available, otherwise null
let realUseStripe: (() => UseStripeReturn) | null = null;
if (isStripeAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    realUseStripe = require('@stripe/stripe-react-native').useStripe;
  } catch {
    // Stripe not available
  }
}

/**
 * Safe wrapper around useStripe that works in Expo Go
 * Returns mock functions when native Stripe module isn't available
 */
export function useStripeSafe(): UseStripeReturn {
  // Always call the hook (or mock) unconditionally to satisfy React rules
  const stripeHook = realUseStripe ? realUseStripe() : null;

  if (!stripeHook) {
    return mockStripe;
  }

  return stripeHook;
}

export default useStripeSafe;
