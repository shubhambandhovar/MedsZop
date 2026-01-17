/**
 * Payment Service - Refactored
 * Clean interfaces, proper error handling, and separation of concerns
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment, IPayment } from '../models/Payment';
import { Insurance } from '../models/Insurance';
import {
  CreatePaymentOrderRequest,
  VerifyPaymentRequest,
  WebhookPayload,
  PaymentOrderResponse,
  PaymentVerificationResponse,
  WebhookResponse,
  PaymentServiceError,
  PaymentErrorCode,
  PaymentServiceConfig,
} from '../types/payment.types';
import { PaymentValidator } from '../utils/paymentValidator';

/**
 * Payment Service Class
 * Handles all payment-related operations with Razorpay integration
 */
export class PaymentService {
  private razorpay: Razorpay;
  private config: PaymentServiceConfig;

  constructor() {
    // Load configuration
    this.config = {
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
      razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
      defaultCurrency: 'INR',
      minAmount: 1,
      maxAmount: 500000,
    };

    // Initialize Razorpay
    this.razorpay = new Razorpay({
      key_id: this.config.razorpayKeyId,
      key_secret: this.config.razorpayKeySecret,
    });
  }
  /**
   * Create payment order with Razorpay
   * Handles insurance coverage calculation if applicable
   */
  async createPaymentOrder(request: CreatePaymentOrderRequest): Promise<PaymentOrderResponse> {
    try {
      // Validate request
      PaymentValidator.validateOrderCreation(request);

      const { userId, orderId, amount, currency = this.config.defaultCurrency, insuranceId } = request;

      // Calculate insurance coverage if applicable
      const insuranceData = await this.calculateInsuranceCoverage(amount, insuranceId);

      // Create Razorpay order
      const razorpayOrder = await this.createRazorpayOrder({
        amount: insuranceData.userPayableAmount,
        currency,
        orderId,
        userId,
        insuranceUsed: insuranceData.insuranceUsed,
      });

      // Save payment record to database
      const payment = await this.savePaymentRecord({
        orderId,
        userId,
        amount,
        currency,
        gatewayOrderId: razorpayOrder.id,
        insuranceData,
      });

      return {
        success: true,
        paymentId: payment._id.toString(),
        gatewayOrderId: razorpayOrder.id,
        amount: insuranceData.userPayableAmount,
        currency,
        insuranceCoveredAmount: insuranceData.insuranceCoveredAmount,
        razorpayKeyId: this.config.razorpayKeyId,
      };
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        throw error;
      }
      console.error('Create payment order error:', error);
      throw new PaymentServiceError(
        `Payment order creation failed: ${error.message}`,
        PaymentErrorCode.ORDER_CREATION_FAILED,
        error
      );
    }
  }

  /**
   * Verify payment signature from Razorpay
   * Updates payment status and insurance coverage
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<PaymentVerificationResponse> {
    try {
      // Validate request
      PaymentValidator.validatePaymentVerification(request);

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request;

      // Verify signature
      if (!this.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        throw new PaymentServiceError(
          'Payment verification failed: Invalid signature',
          PaymentErrorCode.INVALID_SIGNATURE
        );
      }

      // Find payment record
      const payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });
      if (!payment) {
        throw new PaymentServiceError(
          'Payment record not found',
          PaymentErrorCode.PAYMENT_NOT_FOUND
        );
      }

      // Fetch payment details from Razorpay
      const razorpayPayment = await this.razorpay.payments.fetch(razorpay_payment_id);

      // Update payment record
      await this.updatePaymentSuccess(payment, razorpay_payment_id, razorpayPayment);

      // Update insurance if used
      if (payment.insuranceUsed && payment.insuranceId && payment.insuranceCoveredAmount) {
        await this.updateInsuranceCoverage(
          payment.insuranceId.toString(),
          payment.insuranceCoveredAmount
        );
      }

      return {
        success: true,
        payment: payment.toObject(),
        message: 'Payment verified successfully',
      };
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        // Update payment as failed if record exists
        await this.updatePaymentFailure(request.razorpay_order_id, error.message);
        throw error;
      }
      
      console.error('Payment verification error:', error);
      await this.updatePaymentFailure(request.razorpay_order_id, error.message);
      
      throw new PaymentServiceError(
        `Payment verification failed: ${error.message}`,
        PaymentErrorCode.VERIFICATION_FAILED,
        error
      );
    }
  }

  /**
   * Handle Razorpay webhook events
   * Processes payment status updates from Razorpay
   */
  async handleWebhook(body: WebhookPayload, signature: string): Promise<WebhookResponse> {
    try {
      // Validate webhook signature
      PaymentValidator.validateWebhookSignature(signature);

      if (!this.verifyWebhookSignature(body, signature)) {
        throw new PaymentServiceError(
          'Invalid webhook signature',
          PaymentErrorCode.WEBHOOK_ERROR
        );
      }

      const event = body.event;
      const paymentEntity = body.payload.payment.entity;

      // Find payment record
      const payment = await Payment.findOne({ gatewayOrderId: paymentEntity.order_id });
      if (!payment) {
        console.warn('Payment record not found for webhook:', paymentEntity.order_id);
        return { success: true, message: 'No action needed' };
      }

      // Process event
      await this.processWebhookEvent(payment, event, paymentEntity);

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        throw error;
      }
      console.error('Webhook handling error:', error);
      throw new PaymentServiceError(
        `Webhook processing failed: ${error.message}`,
        PaymentErrorCode.WEBHOOK_ERROR,
        error
      );
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<IPayment | null> {
    try {
      return await Payment.findOne({ orderId: new mongoose.Types.ObjectId(orderId) })
        .populate('insuranceId')
        .exec();
    } catch (error: any) {
      console.error('Get payment error:', error);
      throw new PaymentServiceError(
        `Failed to fetch payment: ${error.message}`,
        PaymentErrorCode.PAYMENT_NOT_FOUND,
        error
      );
    }
  }

  /**
   * Get user payments with pagination
   */
  async getUserPayments(userId: string, limit = 10): Promise<IPayment[]> {
    try {
      return await Payment.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('insuranceId')
        .exec();
    } catch (error: any) {
      console.error('Get user payments error:', error);
      throw new PaymentServiceError(
        `Failed to fetch user payments: ${error.message}`,
        PaymentErrorCode.PAYMENT_NOT_FOUND,
        error
      );
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate insurance coverage for an amount
   */
  private async calculateInsuranceCoverage(
    amount: number,
    insuranceId?: string
  ): Promise<{
    insuranceUsed: boolean;
    insuranceCoveredAmount: number;
    userPayableAmount: number;
    insuranceObjectId?: mongoose.Types.ObjectId;
  }> {
    let insuranceCoveredAmount = 0;
    let userPayableAmount = amount;
    let insuranceUsed = false;
    let insuranceObjectId: mongoose.Types.ObjectId | undefined;

    if (insuranceId) {
      try {
        const insurance = await Insurance.findById(insuranceId);
        if (insurance && insurance.verificationStatus === 'approved') {
          // Mock coverage calculation - replace with actual provider API
          const coveragePercentage = 0.3; // 30% coverage
          insuranceCoveredAmount = Math.min(
            amount * coveragePercentage,
            insurance.remainingCoverage
          );
          userPayableAmount = amount - insuranceCoveredAmount;
          insuranceUsed = true;
          insuranceObjectId = new mongoose.Types.ObjectId(insuranceId);
        }
      } catch (error: any) {
        console.warn('Insurance calculation error:', error);
        // Continue without insurance if there's an error
      }
    }

    return {
      insuranceUsed,
      insuranceCoveredAmount,
      userPayableAmount,
      insuranceObjectId,
    };
  }

  /**
   * Create Razorpay order
   */
  private async createRazorpayOrder(params: {
    amount: number;
    currency: string;
    orderId: string;
    userId: string;
    insuranceUsed: boolean;
  }): Promise<any> {
    try {
      return await this.razorpay.orders.create({
        amount: Math.round(params.amount * 100), // Amount in paise
        currency: params.currency,
        receipt: `order_${params.orderId}`,
        notes: {
          orderId: params.orderId,
          userId: params.userId,
          insuranceUsed: params.insuranceUsed.toString(),
        },
      });
    } catch (error: any) {
      throw new PaymentServiceError(
        `Razorpay order creation failed: ${error.message}`,
        PaymentErrorCode.GATEWAY_ERROR,
        error
      );
    }
  }

  /**
   * Save payment record to database
   */
  private async savePaymentRecord(params: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    gatewayOrderId: string;
    insuranceData: any;
  }): Promise<IPayment> {
    return await Payment.create({
      orderId: new mongoose.Types.ObjectId(params.orderId),
      userId: new mongoose.Types.ObjectId(params.userId),
      gatewayOrderId: params.gatewayOrderId,
      paymentGateway: 'razorpay',
      amount: params.amount,
      currency: params.currency,
      paymentStatus: 'pending',
      insuranceUsed: params.insuranceData.insuranceUsed,
      insuranceId: params.insuranceData.insuranceObjectId,
      insuranceCoveredAmount: params.insuranceData.insuranceCoveredAmount,
      userPayableAmount: params.insuranceData.userPayableAmount,
      paymentMethod: 'upi', // Default, will be updated on verification
    });
  }

  /**
   * Verify Razorpay signature
   */
  private verifySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const generatedSignature = crypto
      .createHmac('sha256', this.config.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(body: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.razorpayWebhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Update payment status to success
   */
  private async updatePaymentSuccess(
    payment: IPayment,
    transactionId: string,
    razorpayPayment: any
  ): Promise<void> {
    payment.transactionId = transactionId;
    payment.paymentStatus = 'success';
    payment.paymentMethod = this.mapRazorpayMethod(razorpayPayment.method);
    payment.gatewayResponse = razorpayPayment;
    await payment.save();
  }

  /**
   * Update payment status to failed
   */
  private async updatePaymentFailure(orderId: string, reason: string): Promise<void> {
    const payment = await Payment.findOne({ gatewayOrderId: orderId });
    if (payment) {
      payment.paymentStatus = 'failed';
      payment.failureReason = reason;
      await payment.save();
    }
  }

  /**
   * Update insurance coverage after successful payment
   */
  private async updateInsuranceCoverage(
    insuranceId: string,
    coveredAmount: number
  ): Promise<void> {
    await Insurance.findByIdAndUpdate(insuranceId, {
      $inc: { usedCoverage: coveredAmount },
    });
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(
    payment: IPayment,
    event: string,
    paymentEntity: any
  ): Promise<void> {
    switch (event) {
      case 'payment.captured':
        payment.paymentStatus = 'success';
        payment.transactionId = paymentEntity.id;
        payment.webhookData = paymentEntity;
        break;

      case 'payment.failed':
        payment.paymentStatus = 'failed';
        payment.failureReason = paymentEntity.error_description || 'Payment failed';
        payment.webhookData = paymentEntity;
        break;

      default:
        console.log('Unhandled webhook event:', event);
        return;
    }

    await payment.save();
  }

  /**
   * Map Razorpay payment method to our enum
   */
  private mapRazorpayMethod(method: string): IPayment['paymentMethod'] {
    const mapping: Record<string, IPayment['paymentMethod']> = {
      upi: 'upi',
      card: 'card',
      netbanking: 'netbanking',
      wallet: 'wallet',
      paylater: 'paylater',
    };
    return mapping[method] || 'card';
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
