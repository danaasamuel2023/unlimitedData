# Deposit 500 Error - Solution Guide

## 🚨 Problem Description

You're experiencing a **500 Internal Server Error** when trying to access the deposit endpoint:
```
unlimiteddatagh.onrender.com/api/v1/deposit:1 Failed to load resource: the server responded with a status of 500
```

## 🔍 Root Cause Analysis

The 500 error is caused by **missing Paystack API keys** in the environment variables. Here's what happens:

1. **Deposit Request** → Server receives request
2. **Paystack API Call** → Server tries to initialize payment with Paystack
3. **Missing API Keys** → Paystack API call fails due to undefined `PAYSTACK_SECRET_KEY`
4. **Unhandled Error** → Server crashes and returns 500 error

## ✅ Solution Implemented

### 1. **Enhanced Error Handling**

The deposit route now includes proper error handling:

```javascript
// Check if Paystack is properly configured
if (!paystackConfigValid) {
  return res.status(503).json({ 
    success: false, 
    error: 'Payment service temporarily unavailable',
    message: 'Paystack configuration is missing. Please contact support.',
    details: 'PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY environment variables are required'
  });
}
```

### 2. **Better Paystack API Error Handling**

```javascript
try {
  const paystackResponse = await axios.post(/* ... */);
  // Handle success
} catch (paystackError) {
  console.error('Paystack API Error:', paystackError.response?.data || paystackError.message);
  
  return res.status(502).json({
    success: false,
    error: 'Payment gateway error',
    message: 'Unable to initialize payment. Please try again.',
    details: paystackError.response?.data?.message || 'Paystack API error'
  });
}
```

### 3. **Environment Setup Script**

Created `setup-env.js` to help diagnose and fix environment issues:

```bash
node setup-env.js
```

## 🔧 How to Fix the Issue

### For Local Development:

1. **Get Paystack API Keys**:
   - Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
   - Copy your test keys (use `sk_test_*` for development)

2. **Set Environment Variables**:
   ```bash
   # In your .env file or environment
   PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
   PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
   ```

3. **Restart Server**:
   ```bash
   npm start
   ```

### For Production (Render.com):

1. **Add Environment Variables in Render Dashboard**:
   - Go to your service settings
   - Add environment variables:
     - `PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key`
     - `PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key`
     - `BASE_URL=https://unlimiteddatagh.onrender.com`

2. **Redeploy Service**:
   - Trigger a new deployment after adding environment variables

## 🧪 Testing the Fix

### 1. **Test Error Handling**:
```bash
node test-deposit-error.js
```

### 2. **Test with Valid Keys**:
```bash
# Set environment variables
export PAYSTACK_SECRET_KEY=sk_test_your_key
export PAYSTACK_PUBLIC_KEY=pk_test_your_key

# Test deposit
curl -X POST http://localhost:5000/api/v1/deposit \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user_id","amount":10.00,"email":"test@example.com"}'
```

## 📊 Expected Responses

### ❌ **Before Fix (500 Error)**:
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

### ✅ **After Fix (503 Service Unavailable)**:
```json
{
  "success": false,
  "error": "Payment service temporarily unavailable",
  "message": "Paystack configuration is missing. Please contact support.",
  "details": "PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY environment variables are required"
}
```

### ✅ **With Valid Configuration**:
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

## 🔒 Security Notes

### **Test vs Live Keys**:
- **Development**: Use `sk_test_*` and `pk_test_*` keys
- **Production**: Use `sk_live_*` and `pk_live_*` keys
- **Never commit API keys to version control**

### **Environment Variables**:
```bash
# Development (.env file)
PAYSTACK_SECRET_KEY=sk_test_1234567890abcdef
PAYSTACK_PUBLIC_KEY=pk_test_1234567890abcdef

# Production (Render environment variables)
PAYSTACK_SECRET_KEY=sk_live_1234567890abcdef
PAYSTACK_PUBLIC_KEY=pk_live_1234567890abcdef
```

## 🚀 Deployment Checklist

- [ ] Set `PAYSTACK_SECRET_KEY` environment variable
- [ ] Set `PAYSTACK_PUBLIC_KEY` environment variable  
- [ ] Set `BASE_URL` environment variable
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test deposit endpoint
- [ ] Verify error handling works
- [ ] Monitor logs for any issues

## 📞 Support

If you continue to experience issues:

1. **Check Environment Variables**:
   ```bash
   node setup-env.js
   ```

2. **Check Server Logs**:
   ```bash
   # Look for Paystack configuration errors
   tail -f logs/app.log
   ```

3. **Test Paystack Connection**:
   ```bash
   node test-payment-flow.js
   ```

## 🎯 Summary

The 500 error was caused by missing Paystack API keys. The solution includes:

1. ✅ **Better error handling** - Returns 503 instead of 500
2. ✅ **Clear error messages** - Explains what's missing
3. ✅ **Environment setup script** - Helps diagnose issues
4. ✅ **Comprehensive testing** - Verifies the fix works

**Next Step**: Set your Paystack API keys and the deposit endpoint will work correctly!

---

**Last Updated**: January 2024  
**Status**: ✅ **RESOLVED**
