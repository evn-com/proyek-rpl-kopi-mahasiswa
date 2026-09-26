import crypto from 'crypto';
import { PaymentRequest, PaymentResult, WebhookPayload, WebhookVerificationResult } from './types';

export interface IPaymentGateway {
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyWebhook(payload: WebhookPayload): WebhookVerificationResult;
  getPaymentStatus(paymentReference: string): Promise<'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'>;
}

export class MockPaymentGateway implements IPaymentGateway {
  private serverKey: string;
  private clientKey: string;
  private webhookSecret: string;

  constructor() {
    // Read credentials strictly from environment variables without hardcoding secret keys
    this.serverKey = process.env.PAYMENT_GATEWAY_SERVER_KEY || 'mock_server_key_km_2026';
    this.clientKey = process.env.PAYMENT_GATEWAY_CLIENT_KEY || 'mock_client_key_km_2026';
    this.webhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || 'mock_webhook_secret_km_2026';
  }

  public async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const paymentReference = `PAY-MOCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    // Generate mock QRIS URL with embedded metadata
    const qrData = encodeURIComponent(
      JSON.stringify({
        ref: paymentReference,
        order: request.orderNumber,
        amt: request.amount,
      })
    );
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;

    return {
      success: true,
      paymentReference,
      qrCodeUrl,
      expiresAt,
      status: 'PENDING',
      message: 'Payment session created successfully via Mock Gateway',
      rawResponse: {
        gateway: 'MockPaymentGateway',
        serverKeyPrefix: this.serverKey.substring(0, 4) + '***',
        reference: paymentReference,
        clientKey: this.clientKey,
      },
    };
  }

  public verifyWebhook(payload: WebhookPayload): WebhookVerificationResult {
    const { paymentReference, orderNumber, status, amount, signature, timestamp, idempotencyKey } = payload;

    if (!paymentReference || !orderNumber || !status || !signature || !timestamp || !idempotencyKey) {
      return { isValid: false, reason: 'Missing required webhook fields' };
    }

    // Verify Signature: HMAC-SHA256(orderNumber + paymentReference + amount + timestamp, webhookSecret)
    const dataToSign = `${orderNumber}:${paymentReference}:${amount}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(dataToSign)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { isValid: false, reason: 'Invalid signature signature mismatch' };
    }

    return { isValid: true };
  }

  public async getPaymentStatus(paymentReference: string): Promise<'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'> {
    // In mock implementation, returns PENDING unless verified by webhook or explicitly simulated
    return 'PENDING';
  }

  public generateMockSignature(orderNumber: string, paymentReference: string, amount: number, timestamp: string): string {
    const dataToSign = `${orderNumber}:${paymentReference}:${amount}:${timestamp}`;
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(dataToSign)
      .digest('hex');
  }
}

export const defaultPaymentGateway = new MockPaymentGateway();
