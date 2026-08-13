import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { SubscriptionTier } from '../types';

export const paymentService = {
  /**
   * Calls the createMorningCheckout Firebase Function.
   * If Morning Pay is configured, it returns a real checkout URL.
   * If it's in mock mode (no keys yet), it returns a success mock status.
   */
  async createCheckoutSession(tier: SubscriptionTier): Promise<{ checkoutUrl?: string | null, mockMode?: boolean, message?: string }> {
    try {
      // In firebase config, we export 'functions'. We use that instance.
      const createCheckout = httpsCallable(functions, 'createMorningCheckout');
      
      const result = await createCheckout({ tier });
      const data = result.data as { checkoutUrl?: string | null, mockMode?: boolean, message?: string };
      
      return data;
    } catch (error) {
      console.error('Error calling createMorningCheckout:', error);
      throw error;
    }
  }
};
