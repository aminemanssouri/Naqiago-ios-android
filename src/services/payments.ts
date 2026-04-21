import { supabase } from '../lib/supabase';

// Payment types based on database schema
export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  amount: number;
  currency: string;
  payment_method: 'cash' | 'card' | 'mobile' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  gateway_transaction_id: string | null;
  gateway_reference: string | null;
  gateway_response: any;
  platform_fee: number;
  worker_earnings: number;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
type PaymentUpdate = Partial<PaymentInsert>;

export interface CreatePaymentData {
  bookingId: string;
  customerId: string;
  workerId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'wallet';
  platformFeePercentage?: number; // Default 15%
}

class PaymentsService {
  private readonly DEFAULT_PLATFORM_FEE = 15; // 15% platform fee
  private readonly DEFAULT_CURRENCY = 'MAD';

  /**
   * Create a payment record for a booking
   * This should be called immediately after creating a booking
   */
  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    try {
      // Calculate platform fee and worker earnings
      const platformFeePercentage = paymentData.platformFeePercentage || this.DEFAULT_PLATFORM_FEE;
      const platformFee = (paymentData.amount * platformFeePercentage) / 100;
      const workerEarnings = paymentData.amount - platformFee;

      const insertData: PaymentInsert = {
        booking_id: paymentData.bookingId,
        customer_id: paymentData.customerId,
        worker_id: paymentData.workerId,
        amount: paymentData.amount,
        currency: this.DEFAULT_CURRENCY,
        payment_method: paymentData.paymentMethod as any,
        status: 'pending', // Will be updated when payment is processed
        platform_fee: platformFee,
        worker_earnings: workerEarnings,
        // These fields are null initially and set when payment is processed
        gateway_transaction_id: null,
        gateway_reference: null,
        gateway_response: null,
        processed_at: null,
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Payment creation error:', error);
        throw error;
      }

      console.log('✅ Payment record created:', {
        id: data.id,
        booking_id: data.booking_id,
        amount: data.amount,
        platform_fee: data.platform_fee,
        worker_earnings: data.worker_earnings,
        status: data.status
      });

      return data;
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  }

  /**
   * Update payment status (e.g., when payment is completed)
   */
  async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
    gatewayData?: {
      transactionId?: string;
      reference?: string;
      response?: any;
    }
  ): Promise<Payment> {
    try {
      const updateData: any = {
        status,
      };

      // Set processed timestamp when payment is completed
      if (status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      // Add gateway information if provided
      if (gatewayData) {
        if (gatewayData.transactionId) {
          updateData.gateway_transaction_id = gatewayData.transactionId;
        }
        if (gatewayData.reference) {
          updateData.gateway_reference = gatewayData.reference;
        }
        if (gatewayData.response) {
          updateData.gateway_response = gatewayData.response;
        }
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Payment status updated:', {
        id: data.id,
        status: data.status,
        processed_at: data.processed_at
      });

      return data;
    } catch (error) {
      console.error('Update payment status error:', error);
      throw error;
    }
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        // If no payment found, return null instead of throwing
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get payment by booking ID error:', error);
      throw error;
    }
  }

  /**
   * Get payments for a customer
   */
  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get customer payments error:', error);
      throw error;
    }
  }

  /**
   * Get payments for a worker
   */
  async getWorkerPayments(workerId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get worker payments error:', error);
      throw error;
    }
  }

  /**
   * Calculate worker earnings summary
   */
  async getWorkerEarningsSummary(workerId: string): Promise<{
    totalEarnings: number;
    pendingEarnings: number;
    completedEarnings: number;
    totalPayments: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('worker_earnings, status')
        .eq('worker_id', workerId);

      if (error) throw error;

      const summary = (data || []).reduce(
        (acc, payment) => {
          acc.totalPayments++;
          acc.totalEarnings += Number(payment.worker_earnings) || 0;
          
          if (payment.status === 'completed') {
            acc.completedEarnings += Number(payment.worker_earnings) || 0;
          } else if (payment.status === 'pending' || payment.status === 'processing') {
            acc.pendingEarnings += Number(payment.worker_earnings) || 0;
          }
          
          return acc;
        },
        {
          totalEarnings: 0,
          pendingEarnings: 0,
          completedEarnings: 0,
          totalPayments: 0,
        }
      );

      return summary;
    } catch (error) {
      console.error('Get worker earnings summary error:', error);
      throw error;
    }
  }

  /**
   * Process cash payment (mark as completed when service is done)
   */
  async processCashPayment(bookingId: string): Promise<Payment> {
    try {
      // Get the payment record
      const payment = await this.getPaymentByBookingId(bookingId);
      
      if (!payment) {
        throw new Error('Payment record not found for booking');
      }

      if (payment.payment_method !== 'cash') {
        throw new Error('This payment is not a cash payment');
      }

      // Update status to completed
      return await this.updatePaymentStatus(payment.id, 'completed', {
        reference: `CASH-${Date.now()}`,
        response: { method: 'cash', completed_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Process cash payment error:', error);
      throw error;
    }
  }
}

export const paymentsService = new PaymentsService();
