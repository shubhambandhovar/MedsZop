/**
 * Payment Validation Utilities
 */

import {
  CreatePaymentOrderRequest,
  VerifyPaymentRequest,
  PaymentServiceError,
  PaymentErrorCode,
} from '../types/payment.types';

export class PaymentValidator {
  private static readonly MIN_AMOUNT = 1; // ₹1
  private static readonly MAX_AMOUNT = 500000; // ₹5 lakhs
  private static readonly SUPPORTED_CURRENCIES = ['INR', 'USD'];

  /**
   * Validate payment order creation request
   */
  static validateOrderCreation(request: CreatePaymentOrderRequest): void {
    // Validate amount
    if (!request.amount || typeof request.amount !== 'number') {
      throw new PaymentServiceError(
        'Amount is required and must be a number',
        PaymentErrorCode.INVALID_AMOUNT
      );
    }

    if (request.amount < this.MIN_AMOUNT) {
      throw new PaymentServiceError(
        `Amount must be at least ₹${this.MIN_AMOUNT}`,
        PaymentErrorCode.INVALID_AMOUNT
      );
    }

    if (request.amount > this.MAX_AMOUNT) {
      throw new PaymentServiceError(
        `Amount cannot exceed ₹${this.MAX_AMOUNT}`,
        PaymentErrorCode.INVALID_AMOUNT
      );
    }

    // Validate currency
    if (request.currency && !this.SUPPORTED_CURRENCIES.includes(request.currency)) {
      throw new PaymentServiceError(
        `Currency must be one of: ${this.SUPPORTED_CURRENCIES.join(', ')}`,
        PaymentErrorCode.INVALID_AMOUNT
      );
    }

    // Validate IDs
    if (!request.userId || typeof request.userId !== 'string') {
      throw new PaymentServiceError(
        'User ID is required',
        PaymentErrorCode.ORDER_CREATION_FAILED
      );
    }

    if (!request.orderId || typeof request.orderId !== 'string') {
      throw new PaymentServiceError(
        'Order ID is required',
        PaymentErrorCode.ORDER_CREATION_FAILED
      );
    }
  }

  /**
   * Validate payment verification request
   */
  static validatePaymentVerification(request: VerifyPaymentRequest): void {
    if (!request.razorpay_order_id) {
      throw new PaymentServiceError(
        'Razorpay order ID is required',
        PaymentErrorCode.VERIFICATION_FAILED
      );
    }

    if (!request.razorpay_payment_id) {
      throw new PaymentServiceError(
        'Razorpay payment ID is required',
        PaymentErrorCode.VERIFICATION_FAILED
      );
    }

    if (!request.razorpay_signature) {
      throw new PaymentServiceError(
        'Razorpay signature is required',
        PaymentErrorCode.VERIFICATION_FAILED
      );
    }
  }

  /**
   * Validate webhook signature presence
   */
  static validateWebhookSignature(signature: string | undefined): void {
    if (!signature) {
      throw new PaymentServiceError(
        'Webhook signature is required',
        PaymentErrorCode.WEBHOOK_ERROR
      );
    }
  }
}
