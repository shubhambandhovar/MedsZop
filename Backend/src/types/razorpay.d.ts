declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface RazorpayOrders {
    create(options: any): Promise<any>;
  }

  interface RazorpayPayments {
    fetch(paymentId: string): Promise<any>;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: RazorpayOrders;
    payments: RazorpayPayments;
  }
}
