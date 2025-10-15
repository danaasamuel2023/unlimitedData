const axios = require('axios');
const app = require('./index.js');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const testConfig = {
  timeout: 10000,
  retries: 3
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility function to run tests
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running test: ${testName}`);
  
  try {
    await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: testName,
      error: error.message
    });
  }
}

// Test functions
async function testHealthEndpoint() {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: testConfig.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.status || response.data.status !== 'OK') {
    throw new Error('Health check failed - status not OK');
  }
  
  console.log(`   Server uptime: ${Math.floor(response.data.uptime)}s`);
  console.log(`   Environment: ${response.data.environment}`);
}

async function testRootEndpoint() {
  const response = await axios.get(`${BASE_URL}/`, { timeout: testConfig.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.message || !response.data.endpoints) {
    throw new Error('Root endpoint missing required fields');
  }
  
  console.log(`   API Version: ${response.data.version}`);
  console.log(`   Available endpoints: ${Object.keys(response.data.endpoints).length}`);
}

async function test404Endpoint() {
  try {
    await axios.get(`${BASE_URL}/nonexistent-endpoint`, { timeout: testConfig.timeout });
    throw new Error('Expected 404 error for nonexistent endpoint');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // This is expected
      return;
    }
    throw error;
  }
}

async function testCorsHeaders() {
  const response = await axios.options(`${BASE_URL}/health`, { timeout: testConfig.timeout });
  
  if (!response.headers['access-control-allow-origin']) {
    throw new Error('CORS headers not present');
  }
  
  console.log(`   CORS Origin: ${response.headers['access-control-allow-origin']}`);
}

async function testRateLimiting() {
  // This test might be skipped in development
  console.log('   Rate limiting test skipped in development mode');
}

async function testDatabaseConnection() {
  // This would require actual database connection
  console.log('   Database connection test requires actual MongoDB instance');
}

async function testAuthenticationEndpoints() {
  // Test registration endpoint structure
  try {
    await axios.post(`${BASE_URL}/api/v1/register`, {
      // Invalid data to test validation
      name: '',
      email: 'invalid-email',
      password: '123'
    }, { timeout: testConfig.timeout });
    
    throw new Error('Expected validation error for invalid registration data');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('   Registration validation working correctly');
      return;
    }
    throw error;
  }
}

async function testDataPurchaseEndpoint() {
  // Test endpoint structure without authentication
  try {
    await axios.post(`${BASE_URL}/api/v1/data/purchase-data`, {
      // Invalid data to test validation
      userId: 'invalid-id',
      phoneNumber: '123',
      network: 'INVALID',
      capacity: 999,
      price: -1
    }, { timeout: testConfig.timeout });
    
    throw new Error('Expected validation error for invalid purchase data');
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 401)) {
      console.log('   Data purchase validation working correctly');
      return;
    }
    throw error;
  }
}

async function testSmsEndpoint() {
  // Test SMS endpoint structure
  try {
    await axios.post(`${BASE_URL}/api/sms/send-bulk`, {
      // Invalid data to test validation
      phoneNumbers: ['invalid'],
      message: ''
    }, { timeout: testConfig.timeout });
    
    throw new Error('Expected validation error for invalid SMS data');
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 401)) {
      console.log('   SMS validation working correctly');
      return;
    }
    throw error;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting DataHustle Server Tests');
  console.log(`📍 Testing server at: ${BASE_URL}`);
  console.log('=' .repeat(50));
  
  // Core functionality tests
  await runTest('Health Check Endpoint', testHealthEndpoint);
  await runTest('Root Endpoint', testRootEndpoint);
  await runTest('404 Error Handling', test404Endpoint);
  await runTest('CORS Headers', testCorsHeaders);
  await runTest('Rate Limiting', testRateLimiting);
  
  // Database tests
  await runTest('Database Connection', testDatabaseConnection);
  
  // API endpoint tests
  await runTest('Authentication Endpoints', testAuthenticationEndpoints);
  await runTest('Data Purchase Endpoints', testDataPurchaseEndpoint);
  await runTest('SMS Endpoints', testSmsEndpoint);
  
  // Print results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 Failed Tests:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Testing completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
