// Paystack Configuration
// This file contains all Paystack-related configuration and utilities

const crypto = require('crypto');

// Paystack Configuration
const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  baseUrl: 'https://api.paystack.co',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY,
  baseCallbackUrl: process.env.BASE_URL || 'https://unlimiteddatagh.onrender.com'
};

// Validate Paystack Configuration
const validatePaystackConfig = () => {
  const errors = [];
  
  if (!PAYSTACK_CONFIG.secretKey) {
    errors.push('PAYSTACK_SECRET_KEY is required');
  }
  
  if (!PAYSTACK_CONFIG.publicKey) {
    errors.push('PAYSTACK_PUBLIC_KEY is required');
  }
  
  if (!PAYSTACK_CONFIG.baseCallbackUrl) {
    errors.push('BASE_URL is required for callback URLs');
  }
  
  if (errors.length > 0) {
    throw new Error(`Paystack configuration errors: ${errors.join(', ')}`);
  }
  
  return true;
};

// Generate Paystack Headers
const getPaystackHeaders = () => {
  return {
    'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
    'Content-Type': 'application/json'
  };
};

// Verify Webhook Signature
const verifyWebhookSignature = (payload, signature) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_CONFIG.webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};

// Generate Callback URL
const generateCallbackUrl = (reference) => {
  return `${PAYSTACK_CONFIG.baseCallbackUrl}/api/v1/callback?reference=${reference}`;
};

// Paystack API Endpoints
const PAYSTACK_ENDPOINTS = {
  initialize: '/transaction/initialize',
  verify: '/transaction/verify',
  listTransactions: '/transaction',
  listBanks: '/bank',
  resolveAccount: '/bank/resolve',
  createTransferRecipient: '/transferrecipient',
  initiateTransfer: '/transfer',
  verifyTransfer: '/transfer/verify'
};

// Currency Configuration
const CURRENCY_CONFIG = {
  GHS: {
    code: 'GHS',
    name: 'Ghana Cedi',
    symbol: '₵',
    minAmount: 1, // Minimum amount in pesewas (1 GHS = 100 pesewas)
    maxAmount: 10000000 // Maximum amount in pesewas (100,000 GHS)
  }
};

// Fee Configuration
const FEE_CONFIG = {
  percentage: 0.03, // 3% fee
  minimum: 0.5, // Minimum fee in GHS
  maximum: 100 // Maximum fee in GHS
};

// Calculate Transaction Fee
const calculateFee = (amount) => {
  const percentageFee = amount * FEE_CONFIG.percentage;
  const fee = Math.max(FEE_CONFIG.minimum, Math.min(FEE_CONFIG.maximum, percentageFee));
  return Math.round(fee * 100) / 100; // Round to 2 decimal places
};

// Convert Amount to Paystack Format (pesewas)
const toPaystackAmount = (amount) => {
  return Math.round(amount * 100);
};

// Convert Amount from Paystack Format (pesewas to GHS)
const fromPaystackAmount = (amount) => {
  return amount / 100;
};

// Validate Amount
const validateAmount = (amount) => {
  const errors = [];
  
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (amount < CURRENCY_CONFIG.GHS.minAmount / 100) {
    errors.push(`Minimum amount is ${CURRENCY_CONFIG.GHS.minAmount / 100} ${CURRENCY_CONFIG.GHS.code}`);
  }
  
  if (amount > CURRENCY_CONFIG.GHS.maxAmount / 100) {
    errors.push(`Maximum amount is ${CURRENCY_CONFIG.GHS.maxAmount / 100} ${CURRENCY_CONFIG.GHS.code}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate Transaction Reference
const generateReference = (prefix = 'DEP') => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `${prefix}-${randomBytes}-${timestamp}`;
};

// Payment Status Mapping
const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ABANDONED: 'abandoned'
};

// Export Configuration
module.exports = {
  PAYSTACK_CONFIG,
  PAYSTACK_ENDPOINTS,
  CURRENCY_CONFIG,
  FEE_CONFIG,
  PAYMENT_STATUS,
  validatePaystackConfig,
  getPaystackHeaders,
  verifyWebhookSignature,
  generateCallbackUrl,
  calculateFee,
  toPaystackAmount,
  fromPaystackAmount,
  validateAmount,
  generateReference
};
