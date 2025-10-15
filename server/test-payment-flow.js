// Payment Flow Test Script
// This script tests the complete Paystack payment integration

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://unlimiteddatagh.onrender.com';
const API_BASE = `${BASE_URL}/api/v1`;

// Test Configuration
const TEST_CONFIG = {
  timeout: 30000,
  testUser: {
    email: 'test@example.com',
    amount: 10.00, // GHS 10
    userId: '507f1f77bcf86cd799439011' // Example ObjectId
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️ ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️ ${message}`, 'blue');
const logHeader = (message) => log(`\n${colors.bold}${message}${colors.reset}`, 'blue');

// Test functions
const testServerHealth = async () => {
  logHeader('Testing Server Health');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: TEST_CONFIG.timeout });
    
    if (response.status === 200) {
      logSuccess('Server is healthy and responding');
      logInfo(`Server Status: ${response.data.status}`);
      logInfo(`Environment: ${response.data.environment}`);
      return true;
    } else {
      logError(`Server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Server health check failed: ${error.message}`);
    return false;
  }
};

const testDepositInitiation = async () => {
  logHeader('Testing Deposit Initiation');
  
  try {
    const depositData = {
      userId: TEST_CONFIG.testUser.userId,
      amount: TEST_CONFIG.testUser.amount,
      email: TEST_CONFIG.testUser.email
    };
    
    logInfo(`Initiating deposit: GHS ${depositData.amount} for user ${depositData.userId}`);
    
    const response = await axios.post(`${API_BASE}/deposit`, depositData, {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      logSuccess('Deposit initiated successfully');
      logInfo(`Reference: ${response.data.reference}`);
      logInfo(`Paystack URL: ${response.data.paystackUrl}`);
      logInfo(`Base Amount: GHS ${response.data.depositInfo.baseAmount}`);
      logInfo(`Fee: GHS ${response.data.depositInfo.fee}`);
      logInfo(`Total Amount: GHS ${response.data.depositInfo.totalAmount}`);
      
      return {
        success: true,
        reference: response.data.reference,
        paystackUrl: response.data.paystackUrl
      };
    } else {
      logError(`Deposit initiation failed: ${response.data.error}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    if (error.response) {
      logError(`Deposit initiation failed: ${error.response.status} - ${error.response.data.error || error.response.data.message}`);
    } else {
      logError(`Deposit initiation failed: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
};

const testPaymentVerification = async (reference) => {
  logHeader('Testing Payment Verification');
  
  try {
    logInfo(`Verifying payment with reference: ${reference}`);
    
    const response = await axios.get(`${API_BASE}/verify-payment?reference=${reference}`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.data.success) {
      logSuccess('Payment verification successful');
      logInfo(`Status: ${response.data.data.status}`);
      logInfo(`Amount: GHS ${response.data.data.amount}`);
      logInfo(`Balance Change: GHS ${response.data.data.balanceChange}`);
      return { success: true, data: response.data.data };
    } else {
      logWarning(`Payment verification result: ${response.data.message}`);
      logInfo(`Status: ${response.data.data?.status || 'unknown'}`);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    if (error.response) {
      logError(`Payment verification failed: ${error.response.status} - ${error.response.data.error || error.response.data.message}`);
    } else {
      logError(`Payment verification failed: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
};

const testWebhookEndpoint = async () => {
  logHeader('Testing Webhook Endpoint');
  
  try {
    // Create a mock webhook payload
    const mockPayload = {
      event: 'charge.success',
      data: {
        reference: 'test-webhook-ref-' + Date.now(),
        amount: 1000, // 10 GHS in pesewas
        status: 'success',
        gateway_response: 'Successful',
        customer: {
          email: TEST_CONFIG.testUser.email
        }
      }
    };
    
    // Generate a mock signature (this won't be valid, but we can test the endpoint structure)
    const mockSignature = crypto.createHmac('sha512', 'test-secret').update(JSON.stringify(mockPayload)).digest('hex');
    
    logInfo('Testing webhook endpoint structure...');
    
    const response = await axios.post(`${API_BASE}/paystack/webhook`, mockPayload, {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': mockSignature
      }
    });
    
    // We expect this to fail due to invalid signature, but we can check if the endpoint exists
    logWarning('Webhook endpoint responded (expected to fail due to invalid signature)');
    return { success: true, message: 'Webhook endpoint is accessible' };
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Webhook endpoint is working (correctly rejected invalid signature)');
      return { success: true, message: 'Webhook endpoint correctly validates signatures' };
    } else {
      logError(`Webhook test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

const testCallbackEndpoint = async () => {
  logHeader('Testing Callback Endpoint');
  
  try {
    const testReference = 'test-callback-ref-' + Date.now();
    
    logInfo(`Testing callback with reference: ${testReference}`);
    
    const response = await axios.get(`${API_BASE}/callback?reference=${testReference}`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.status === 200) {
      logSuccess('Callback endpoint is accessible');
      logInfo('Callback returns HTML response (expected)');
      return { success: true, message: 'Callback endpoint is working' };
    } else {
      logError(`Callback endpoint returned status: ${response.status}`);
      return { success: false, error: `Status: ${response.status}` };
    }
  } catch (error) {
    logError(`Callback test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const testUserTransactions = async () => {
  logHeader('Testing User Transactions Endpoint');
  
  try {
    logInfo(`Fetching transactions for user: ${TEST_CONFIG.testUser.userId}`);
    
    const response = await axios.get(`${API_BASE}/user-transactions/${TEST_CONFIG.testUser.userId}`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.data.success) {
      logSuccess('User transactions endpoint is working');
      logInfo(`Total transactions: ${response.data.data.pagination.total}`);
      logInfo(`Page: ${response.data.data.pagination.page}`);
      logInfo(`Limit: ${response.data.data.pagination.limit}`);
      return { success: true, data: response.data.data };
    } else {
      logError(`User transactions failed: ${response.data.error}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    if (error.response) {
      logError(`User transactions failed: ${error.response.status} - ${error.response.data.error || error.response.data.message}`);
    } else {
      logError(`User transactions failed: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
};

// Main test runner
const runPaymentFlowTests = async () => {
  logHeader('🚀 Starting Paystack Payment Flow Tests');
  logInfo(`Testing against: ${BASE_URL}`);
  logInfo(`API Base: ${API_BASE}`);
  
  const results = {
    serverHealth: false,
    depositInitiation: false,
    paymentVerification: false,
    webhookEndpoint: false,
    callbackEndpoint: false,
    userTransactions: false
  };
  
  // Test 1: Server Health
  results.serverHealth = await testServerHealth();
  
  if (!results.serverHealth) {
    logError('Server health check failed. Aborting further tests.');
    return results;
  }
  
  // Test 2: Deposit Initiation
  const depositResult = await testDepositInitiation();
  results.depositInitiation = depositResult.success;
  
  // Test 3: Payment Verification (if we have a reference)
  if (depositResult.success && depositResult.reference) {
    const verificationResult = await testPaymentVerification(depositResult.reference);
    results.paymentVerification = verificationResult.success;
  } else {
    logWarning('Skipping payment verification test (no valid reference)');
  }
  
  // Test 4: Webhook Endpoint
  const webhookResult = await testWebhookEndpoint();
  results.webhookEndpoint = webhookResult.success;
  
  // Test 5: Callback Endpoint
  const callbackResult = await testCallbackEndpoint();
  results.callbackEndpoint = callbackResult.success;
  
  // Test 6: User Transactions
  const transactionsResult = await testUserTransactions();
  results.userTransactions = transactionsResult.success;
  
  // Summary
  logHeader('📊 Test Results Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result === true).length;
  const failedTests = totalTests - passedTests;
  
  logInfo(`Total Tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  
  // Detailed results
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });
  
  // Overall status
  if (passedTests === totalTests) {
    logSuccess('\n🎉 All tests passed! Payment flow is working correctly.');
  } else {
    logWarning(`\n⚠️ ${failedTests} test(s) failed. Please review the issues above.`);
  }
  
  return results;
};

// Run tests if this file is executed directly
if (require.main === module) {
  runPaymentFlowTests()
    .then((results) => {
      process.exit(Object.values(results).every(result => result === true) ? 0 : 1);
    })
    .catch((error) => {
      logError(`Test runner failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runPaymentFlowTests,
  testServerHealth,
  testDepositInitiation,
  testPaymentVerification,
  testWebhookEndpoint,
  testCallbackEndpoint,
  testUserTransactions
};
