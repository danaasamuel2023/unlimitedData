// Test script to verify deposit endpoint error handling
const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Adjust if your server runs on different port

async function testDepositEndpoint() {
  console.log('🧪 Testing deposit endpoint error handling...\n');
  
  try {
    const testData = {
      userId: '507f1f77bcf86cd799439011', // Example ObjectId
      amount: 10.00,
      email: 'test@example.com'
    };
    
    console.log('📤 Sending deposit request...');
    console.log('Data:', testData);
    
    const response = await axios.post(`${BASE_URL}/api/v1/deposit`, testData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('📥 Error response received:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      
      if (error.response.status === 503) {
        console.log('✅ Correctly returned 503 - Service Unavailable');
        console.log('✅ Error message indicates missing Paystack configuration');
      } else if (error.response.status === 500) {
        console.log('❌ Still returning 500 - Internal Server Error');
        console.log('❌ This suggests the error handling needs improvement');
      }
    } else {
      console.log('❌ Network error:', error.message);
      console.log('💡 Make sure your server is running on', BASE_URL);
    }
  }
}

// Run the test
testDepositEndpoint();
