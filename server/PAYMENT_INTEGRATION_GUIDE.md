# Paystack Payment Integration Guide

## Overview

This guide covers the complete Paystack payment integration for the DataHustle application, including deposit functionality, webhook handling, and payment verification.

## 🚀 Quick Start

### 1. Environment Variables

Ensure the following environment variables are set:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here

# Application Configuration
BASE_URL=https://unlimiteddatagh.onrender.com
NODE_ENV=production

# SMS Configuration (for notifications)
MNOTIFY_API_KEY=your_mnotify_api_key
MNOTIFY_SENDER_ID=DataHustle

# Admin Configuration
ADMIN_PHONE=233XXXXXXXXX
ADMIN_EMAIL=admin@datahustle.shop
```

### 2. Paystack Dashboard Configuration

In your Paystack dashboard, configure:

1. **Webhook URL**: `https://unlimiteddatagh.onrender.com/api/v1/paystack/webhook`
2. **Callback URL**: `https://unlimiteddatagh.onrender.com/api/v1/callback`
3. **Events to Listen For**: `charge.success`, `charge.failed`

## 📋 API Endpoints

### Deposit Endpoints

#### 1. Initiate Deposit
```http
POST /api/v1/deposit
Content-Type: application/json

{
  "userId": "user_id_here",
  "amount": 10.00,
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit initiated",
  "paystackUrl": "https://checkout.paystack.com/...",
  "reference": "DEP-abc123-1234567890",
  "depositInfo": {
    "baseAmount": 10.00,
    "fee": 0.30,
    "totalAmount": 10.30
  }
}
```

#### 2. Verify Payment
```http
GET /api/v1/verify-payment?reference=DEP-abc123-1234567890
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified",
  "data": {
    "reference": "DEP-abc123-1234567890",
    "amount": 10.00,
    "status": "completed",
    "balanceBefore": 50.00,
    "balanceAfter": 60.00,
    "balanceChange": 10.00
  }
}
```

#### 3. Get User Transactions
```http
GET /api/v1/user-transactions/:userId?page=1&limit=10&status=all&type=all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "transaction_id",
        "type": "deposit",
        "amount": 10.00,
        "balanceBefore": 50.00,
        "balanceAfter": 60.00,
        "balanceChange": 10.00,
        "isCredit": true,
        "status": "completed",
        "reference": "DEP-abc123-1234567890",
        "gateway": "paystack",
        "description": "Wallet deposit via Paystack",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Webhook Endpoints

#### Paystack Webhook
```http
POST /api/v1/paystack/webhook
Content-Type: application/json
X-Paystack-Signature: signature_here

{
  "event": "charge.success",
  "data": {
    "reference": "DEP-abc123-1234567890",
    "amount": 1030,
    "status": "success",
    "customer": {
      "email": "user@example.com"
    }
  }
}
```

#### Payment Callback
```http
GET /api/v1/callback?reference=DEP-abc123-1234567890
```

## 🔧 Configuration

### Paystack Configuration File

The payment system uses a centralized configuration file at `server/config/paystack.js`:

```javascript
const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  baseUrl: 'https://api.paystack.co',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  baseCallbackUrl: process.env.BASE_URL
};
```

### Fee Configuration

```javascript
const FEE_CONFIG = {
  percentage: 0.03, // 3% fee
  minimum: 0.5,     // Minimum fee in GHS
  maximum: 100      // Maximum fee in GHS
};
```

### Currency Configuration

```javascript
const CURRENCY_CONFIG = {
  GHS: {
    code: 'GHS',
    name: 'Ghana Cedi',
    symbol: '₵',
    minAmount: 1,      // Minimum amount in pesewas
    maxAmount: 10000000 // Maximum amount in pesewas
  }
};
```

## 🔒 Security Features

### 1. Webhook Signature Verification

All webhook requests are verified using HMAC-SHA512:

```javascript
const verifyWebhookSignature = (payload, signature) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_CONFIG.webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};
```

### 2. Fraud Detection

The system includes multiple fraud detection mechanisms:

- **Amount Verification**: Ensures the amount paid matches the expected amount
- **Suspicious Activity Detection**: Monitors for unusual deposit patterns
- **IP-based Rate Limiting**: Prevents abuse from single IP addresses
- **Transaction Duplication Prevention**: Prevents processing the same transaction multiple times

### 3. Rate Limiting

Deposit requests are rate-limited to prevent abuse:

```javascript
const depositLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many deposit attempts, please try again later.'
});
```

## 📱 Frontend Integration

### React/Next.js Integration

```javascript
// Initiate deposit
const initiateDeposit = async (userId, amount, email) => {
  try {
    const response = await fetch('/api/v1/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, amount, email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to Paystack checkout
      window.location.href = data.paystackUrl;
    }
  } catch (error) {
    console.error('Deposit initiation failed:', error);
  }
};

// Verify payment
const verifyPayment = async (reference) => {
  try {
    const response = await fetch(`/api/v1/verify-payment?reference=${reference}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Payment verified:', data.data);
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
};
```

## 🧪 Testing

### Run Payment Flow Tests

```bash
# Test the complete payment flow
node server/test-payment-flow.js
```

### Manual Testing

1. **Test Deposit Initiation**:
   ```bash
   curl -X POST https://unlimiteddatagh.onrender.com/api/v1/deposit \
     -H "Content-Type: application/json" \
     -d '{"userId":"test_user_id","amount":10.00,"email":"test@example.com"}'
   ```

2. **Test Payment Verification**:
   ```bash
   curl "https://unlimiteddatagh.onrender.com/api/v1/verify-payment?reference=YOUR_REFERENCE"
   ```

3. **Test Webhook** (with valid signature):
   ```bash
   curl -X POST https://unlimiteddatagh.onrender.com/api/v1/paystack/webhook \
     -H "Content-Type: application/json" \
     -H "X-Paystack-Signature: YOUR_SIGNATURE" \
     -d '{"event":"charge.success","data":{"reference":"test_ref","amount":1000,"status":"success"}}'
   ```

## 📊 Monitoring and Logging

### Transaction Logging

All transactions are logged with detailed information:

```javascript
console.log('Payment verification:', {
  reference,
  actualAmountPaid,
  expectedAmount,
  baseAmount: transaction.amount,
  fee: transaction.metadata?.fee,
  paystackStatus: paystackData.status
});
```

### Fraud Alerts

Suspicious transactions trigger SMS alerts to administrators:

```javascript
const sendFraudAlert = async (transaction, user) => {
  const adminPhone = process.env.ADMIN_PHONE;
  const message = `🚨 FRAUD! User: ${user.name} (${user.phoneNumber}). Ref: ${transaction.reference}. Expected: ${transaction.metadata.expectedPaystackAmount}, Paid: ${transaction.metadata.actualAmountPaid}`;
  await sendSMS(adminPhone, message);
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL in Paystack dashboard
   - Verify webhook secret configuration
   - Check server logs for signature verification errors

2. **Payment Verification Failing**
   - Ensure Paystack secret key is correct
   - Check if transaction reference exists
   - Verify amount calculations match

3. **Callback Not Working**
   - Check BASE_URL environment variable
   - Verify CORS configuration
   - Ensure callback URL is accessible

4. **SMS Notifications Not Sending**
   - Verify MNOTIFY_API_KEY is set
   - Check SMS provider balance
   - Review SMS configuration

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## 📈 Performance Optimization

### Database Indexing

Ensure proper indexing on transaction collections:

```javascript
// Indexes for better performance
db.transactions.createIndex({ "reference": 1 }, { unique: true });
db.transactions.createIndex({ "userId": 1, "createdAt": -1 });
db.transactions.createIndex({ "status": 1, "createdAt": -1 });
```

### Caching

Consider implementing Redis caching for:
- User balance lookups
- Transaction status checks
- Rate limiting data

## 🔄 Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure Paystack webhook URL
- [ ] Test payment flow in staging environment
- [ ] Verify SMS notifications are working
- [ ] Check fraud detection is active
- [ ] Monitor transaction logs
- [ ] Set up error alerting
- [ ] Configure backup and recovery procedures

## 📞 Support

For technical support:
- Email: tech-support@datahustle.shop
- Documentation: https://docs.datahustle.shop
- Status Page: https://status.datahustle.shop

---

**Last Updated**: January 2024
**Version**: 1.0.0
