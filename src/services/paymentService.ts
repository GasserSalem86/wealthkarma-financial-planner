import { loadStripe, Stripe } from '@stripe/stripe-js';
import { formatCurrency } from '../utils/calculations';

// Initialize Stripe (replace with your publishable key)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface PaymentProduct {
  id: string;
  name: string;
  price: number;
  priceId: string;
  description: string;
  features: string[];
}

export const PAYMENT_PRODUCTS: Record<string, PaymentProduct> = {
  'professional-pdf': {
    id: 'professional-pdf',
    name: 'Professional PDF',
    price: 19.99,
    priceId: 'price_professional_pdf', // Replace with actual Stripe price ID
    description: 'Complete personalized plan with bank recommendations',
    features: [
      'Complete month-by-month roadmap',
      'Implementation guide',
      'GCC bank recommendations',
      'No watermarks'
    ]
  },
  'excel-tracker': {
    id: 'excel-tracker',
    name: 'Excel Tracker',
    price: 29.99,
    priceId: 'price_excel_tracker',
    description: 'Interactive spreadsheet with auto-calculations',
    features: [
      'Interactive spreadsheet',
      'Auto-calculations',
      'Progress tracking',
      'Scenario modeling'
    ]
  },
  'complete-package': {
    id: 'complete-package',
    name: 'Complete Package',
    price: 39.99,
    priceId: 'price_complete_package',
    description: 'Everything included with video tutorials',
    features: [
      'Professional PDF',
      'Excel tracker',
      'Video tutorials',
      'Email support'
    ]
  },
  'monthly-subscription': {
    id: 'monthly-subscription',
    name: 'Monthly Subscription',
    price: 9.99,
    priceId: 'price_monthly_subscription',
    description: 'Live tracking and AI coaching',
    features: [
      'Live progress tracking',
      'AI monthly coaching',
      'Plan optimization',
      'Achievement celebrations'
    ]
  },
  'annual-subscription': {
    id: 'annual-subscription',
    name: 'Annual Subscription',
    price: 99.00,
    priceId: 'price_annual_subscription',
    description: 'Best value - save 17%',
    features: [
      'Everything in monthly',
      'Priority support',
      'Advanced analytics',
      '2 months free'
    ]
  }
};

export interface CheckoutOptions {
  productId: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export class PaymentService {
  private stripe: Promise<Stripe | null>;

  constructor() {
    this.stripe = getStripe();
  }

  async createCheckoutSession(options: CheckoutOptions): Promise<{ error?: string; url?: string }> {
    try {
      const product = PAYMENT_PRODUCTS[options.productId];
      if (!product) {
        return { error: 'Invalid product' };
      }

      // Check if we have a valid Stripe key
      const hasValidStripeKey = STRIPE_PUBLISHABLE_KEY && 
        STRIPE_PUBLISHABLE_KEY !== 'pk_test_...' && 
        STRIPE_PUBLISHABLE_KEY.startsWith('pk_');

      // Track checkout initiation
      if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: product.price,
          items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity: 1
          }]
        });
      }

      if (!hasValidStripeKey) {
        // Demo mode - don't redirect to Stripe
        console.log('Demo mode: Stripe not configured');
        console.log('Would create checkout session for:', {
          priceId: product.priceId,
          successUrl: options.successUrl || `${window.location.origin}/success`,
          cancelUrl: options.cancelUrl || `${window.location.origin}/cancel`,
          customerEmail: options.customerEmail,
          metadata: options.metadata || {},
          mode: product.id.includes('subscription') ? 'subscription' : 'payment'
        });
        
        // Show demo message and return error to prevent redirect
        alert(`Demo Mode: ${product.name} ($${product.price}) checkout would be processed here. Payment integration is not configured in this demo.`);
        return { error: 'Payment processing is not configured in demo mode' };
      }

      // Real Stripe integration would go here
      // For now, return error since we don't have backend integration
      console.log('Stripe configured but backend integration needed');
      return { error: 'Payment backend integration required' };

    } catch (error) {
      console.error('Checkout error:', error);
      return { error: 'Payment processing failed' };
    }
  }

  async redirectToCheckout(sessionId: string): Promise<{ error?: string }> {
    try {
      const stripe = await this.stripe;
      if (!stripe) {
        return { error: 'Stripe failed to load' };
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      return { error: error?.message };
    } catch (error) {
      console.error('Redirect error:', error);
      return { error: 'Failed to redirect to checkout' };
    }
  }

  // Excel tracker generation
  async generateExcelTracker(planData: any): Promise<{ error?: string; url?: string }> {
    try {
      // Track Excel generation
      if (window.gtag) {
        window.gtag('event', 'generate_lead', {
          value: 0,
          currency: 'USD'
        });
      }

      console.log('Generating Excel tracker:', planData);
      
      const { excelService } = await import('./excelService');
      const blob = await excelService.generateExcelTracker(planData);
      const url = URL.createObjectURL(blob);
      
      return { url };
    } catch (error) {
      console.error('Excel generation error:', error);
      return { error: 'Failed to generate Excel tracker' };
    }
  }

  async generatePremiumExcel(planData: any, productId: string): Promise<{ error?: string; url?: string }> {
    try {
      // Track premium Excel generation
      if (window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id: `excel-${Date.now()}`,
          value: PAYMENT_PRODUCTS[productId]?.price || 0,
          currency: 'USD'
        });
      }

      console.log('Generating premium Excel tracker:', planData, productId);
      
      const { excelService } = await import('./excelService');
      const blob = await excelService.generateExcelTracker(planData);
      const url = URL.createObjectURL(blob);
      
      return { url };
    } catch (error) {
      console.error('Premium Excel generation error:', error);
      return { error: 'Failed to generate premium Excel tracker' };
    }
  }
}

export const paymentService = new PaymentService(); 