/**
 * Payment Service Type Definitions
 * Clean interfaces for payment operations
 */

import { IPayment } from '../models/Payment';

// Request Types
export interface CreatePaymentOrderRequest {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  insuranceId?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface WebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
  };
}

export interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  error_description?: string;
  [key: string]: any;
}

// Response Types
export interface PaymentOrderResponse {
  success: boolean;
  paymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  insuranceCoveredAmount: number;
  razorpayKeyId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  payment: IPayment;
  message: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
}

// Error Types
export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public code: PaymentErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export enum PaymentErrorCode {
  ORDER_CREATION_FAILED = 'ORDER_CREATION_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  INSURANCE_ERROR = 'INSURANCE_ERROR',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
}

// Configuration
export interface PaymentServiceConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  defaultCurrency: string;
  minAmount: number;
  maxAmount: number;
}
