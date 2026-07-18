import { supabase } from './supabase';

export interface PaymentLogData {
  email: string;
  funnel_type: 'checkout' | 'render-upsell' | 'full-upsell' | 'books-upsell' | 'books-downsell';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency?: string;
  payment_intent_id?: string;
  payment_method_id?: string;
  customer_id?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export async function logPayment(data: PaymentLogData): Promise<void> {
  try {
    console.log('[Payment Logging] Attempting to log payment:', data);
    
    const { error } = await supabase.from('payment_logs').insert({
      email: data.email,
      funnel_type: data.funnel_type,
      status: data.status,
      amount: data.amount,
      currency: data.currency || 'USD',
      payment_intent_id: data.payment_intent_id,
      payment_method_id: data.payment_method_id,
      customer_id: data.customer_id,
      error_message: data.error_message,
      metadata: data.metadata || {},
    });

    if (error) {
      console.error('[Payment Logging] Failed to log payment:', error);
      console.error('[Payment Logging] Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('[Payment Logging] Successfully logged payment');
    }
  } catch (error) {
    console.error('[Payment Logging] Error logging payment:', error);
  }
}

export async function logPaymentSuccess(
  email: string,
  funnel_type: PaymentLogData['funnel_type'],
  amount: number,
  paymentDetails?: {
    payment_intent_id?: string;
    payment_method_id?: string;
    customer_id?: string;
  }
): Promise<void> {
  await logPayment({
    email,
    funnel_type,
    status: 'success',
    amount,
    ...paymentDetails,
  });
}

export async function logPaymentFailure(
  email: string,
  funnel_type: PaymentLogData['funnel_type'],
  amount: number,
  errorMessage: string,
  paymentDetails?: {
    payment_intent_id?: string;
    payment_method_id?: string;
    customer_id?: string;
  }
): Promise<void> {
  await logPayment({
    email,
    funnel_type,
    status: 'failed',
    amount,
    error_message: errorMessage,
    ...paymentDetails,
  });
}

export async function logPaymentPending(
  email: string,
  funnel_type: PaymentLogData['funnel_type'],
  amount: number,
  paymentDetails?: {
    payment_intent_id?: string;
    payment_method_id?: string;
    customer_id?: string;
  }
): Promise<void> {
  await logPayment({
    email,
    funnel_type,
    status: 'pending',
    amount,
    ...paymentDetails,
  });
}
