import React from 'react';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'paylater' | 'insurance';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  insuranceAvailable: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  insuranceAvailable,
}) => {
  const paymentMethods = [
    {
      id: 'upi' as PaymentMethod,
      name: 'UPI',
      icon: '📱',
      description: 'Pay using Google Pay, PhonePe, Paytm',
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay',
    },
    {
      id: 'netbanking' as PaymentMethod,
      name: 'Net Banking',
      icon: '🏦',
      description: 'All Indian banks supported',
    },
    {
      id: 'wallet' as PaymentMethod,
      name: 'Wallets',
      icon: '👛',
      description: 'Paytm, PhonePe, Amazon Pay',
    },
    {
      id: 'paylater' as PaymentMethod,
      name: 'Pay Later',
      icon: '⏰',
      description: 'Buy now, pay later options',
    },
  ];

  if (insuranceAvailable) {
    paymentMethods.push({
      id: 'insurance' as PaymentMethod,
      name: 'Insurance',
      icon: '🛡️',
      description: 'Pay using your insurance policy',
    });
  }

  return (
    <div className="payment-method-selector">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Select Payment Method</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Pick how you want to pay today. Insurance-covered amounts reduce what you pay upfront.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => onMethodSelect(method.id)}
            className={`
              flex items-center gap-4 p-4 border-2 rounded-lg transition-all
              ${
                selectedMethod === method.id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }
            `}
          >
            <span className="text-3xl">{method.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-semibold">{method.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{method.description}</div>
              {method.id === 'insurance' && (
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  We bill your insurer for the covered share; you pay only the remainder.
                </div>
              )}
            </div>
            {selectedMethod === method.id && (
              <span className="text-primary-600 dark:text-primary-400">✓</span>
            )}
          </button>
        ))}
      </div>

      {insuranceAvailable && (
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          Tip: If your policy covers part of the order, we apply that first so you pay only the uncovered amount at checkout.
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
