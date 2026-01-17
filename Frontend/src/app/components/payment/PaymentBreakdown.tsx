import React from 'react';

interface PaymentBreakdownProps {
  subtotal: number;
  insuranceCovered?: number;
  deliveryCharges?: number;
  discount?: number;
  total: number;
  userPayable: number;
}

const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  subtotal,
  insuranceCovered = 0,
  deliveryCharges = 0,
  discount = 0,
  total,
  userPayable,
}) => {
  return (
    <div className="payment-breakdown bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Payment Summary</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          See what your insurer covers and what you pay now.
        </p>
      </div>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>

        {/* Delivery Charges */}
        {deliveryCharges > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Delivery Charges</span>
            <span className="font-medium">₹{deliveryCharges.toFixed(2)}</span>
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span className="font-medium">- ₹{discount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
            <span className="font-semibold">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Insurance Coverage */}
        {insuranceCovered > 0 && (
          <>
            <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
              <span className="flex items-center gap-2">
                <span>🛡️</span>
                Insurance Covered
              </span>
              <span className="font-medium">- ₹{insuranceCovered.toFixed(2)}</span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between text-lg font-bold text-primary-600 dark:text-primary-400">
                <span>You Pay</span>
                <span>₹{userPayable.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                We collect only the uncovered amount now; the covered share is billed to your insurer.
              </p>
            </div>

            {/* Savings Badge */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
              <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                🎉 You're saving ₹{insuranceCovered.toFixed(2)} with insurance!
              </p>
              <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                Final insurer approval may apply; we'll notify you if anything changes.
              </p>
            </div>
          </>
        )}

        {/* No Insurance */}
        {insuranceCovered === 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Payable</span>
              <span className="text-primary-600 dark:text-primary-400">₹{userPayable.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              No insurance applied. You will pay the full amount at checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentBreakdown;
