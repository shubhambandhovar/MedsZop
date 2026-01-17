import React, { useEffect } from 'react';
import paymentService from '../../../services/paymentService';

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency: string;
  gatewayOrderId: string;
  userDetails: {
    name: string;
    email: string;
    contact: string;
  };
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
  onCancel: () => void;
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  orderId,
  amount,
  currency,
  gatewayOrderId,
  userDetails,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript().then((loaded) => {
      if (loaded) {
        initializePayment();
      } else {
        onFailure({ error: 'Failed to load Razorpay SDK' });
      }
    });
  }, []);

  const initializePayment = () => {
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      onFailure({ error: 'Razorpay key not configured' });
      return;
    }

    paymentService.initializeRazorpay(
      {
        key: razorpayKey,
        amount: amount * 100, // Convert to paise
        currency: currency,
        order_id: gatewayOrderId,
        name: 'MedsZop',
        description: `Order #${orderId}`,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.contact,
        },
        theme: {
          color: '#3B82F6', // Primary color
        },
      },
      handlePaymentSuccess,
      handlePaymentFailure
    );
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      // Verify payment on backend
      const verificationResult = await paymentService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (verificationResult.success) {
        onSuccess(verificationResult);
      } else {
        onFailure({ error: 'Payment verification failed' });
      }
    } catch (error) {
      onFailure(error);
    }
  };

  const handlePaymentFailure = (error: any) => {
    onFailure(error);
  };

  return (
    <div className="razorpay-checkout fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <h3 className="text-lg font-semibold">Initializing Payment...</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait while we open the secure payment window. Your card/UPI details are handled by Razorpay and are not stored by MedsZop.
          </p>
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckout;
