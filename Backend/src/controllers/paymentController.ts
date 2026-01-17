import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { PaymentServiceError } from '../types/payment.types';

export class PaymentController {
  /**
   * Create payment order
   * POST /api/payments/create-order
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const { orderId, amount, insuranceId } = req.body;
      const userId = (req as any).user.id;

      if (!orderId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and amount are required',
        });
      }

      const result = await paymentService.createPaymentOrder({
        userId,
        orderId,
        amount: parseFloat(amount),
        currency: 'INR',
        insuranceId,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      }
      console.error('Create order error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create payment order',
      });
    }
  }

  /**
   * Verify payment
   * POST /api/payments/verify
   */
  static async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing payment verification parameters',
        });
      }

      const result = await paymentService.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      }
      console.error('Verify payment error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Payment verification failed',
      });
    }
  }

  /**
   * Razorpay webhook handler
   * POST /api/payments/webhook
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
        });
      }

      const result = await paymentService.handleWebhook(req.body, signature);

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      }
      console.error('Webhook error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Webhook processing failed',
      });
    }
  }

  /**
   * Get payment by order ID
   * GET /api/payments/order/:orderId
   */
  static async getPaymentByOrderId(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const payment = await paymentService.getPaymentByOrderId(orderId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      return res.status(200).json({
        success: true,
        payment,
      });
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        return res.status(404).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      }
      console.error('Get payment error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment',
      });
    }
  }

  /**
   * Get user payments
   * GET /api/payments/user
   */
  static async getUserPayments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const payments = await paymentService.getUserPayments(userId, limit);

      return res.status(200).json({
        success: true,
        payments,
      });
    } catch (error: any) {
      if (error instanceof PaymentServiceError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errorCode: error.code,
        });
      }
      console.error('Get user payments error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payments',
      });
    }
  }
}
