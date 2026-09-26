export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerPhone?: string | null;
  paymentMethod: 'ONLINE_PAYMENT' | 'PAY_AT_CASHIER';
}

export interface PaymentResult {
  success: boolean;
  paymentReference: string;
  qrCodeUrl?: string;
  redirectUrl?: string;
  expiresAt: Date;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  rawResponse?: any;
  message?: string;
}

export interface WebhookPayload {
  paymentReference: string;
  orderNumber: string;
  status: 'PAID' | 'FAILED' | 'EXPIRED';
  amount: number;
  signature: string;
  timestamp: string;
  idempotencyKey: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
}
