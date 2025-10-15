// Environment Setup Script
// This script helps set up environment variables for local development

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for local development...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file already exists');
} else {
  console.log('📝 Creating .env file...');
  
  const envContent = `# DataHustle Server Environment Variables
# Copy this file and fill in your actual values

# Server Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/datahustle

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Paystack Configuration (REQUIRED FOR PAYMENTS)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here

# SMS Configuration
MNOTIFY_API_KEY=your_mnotify_api_key
MNOTIFY_SENDER_ID=DataHustle

# Admin Configuration
ADMIN_PHONE=233XXXXXXXXX
ADMIN_EMAIL=admin@datahustle.shop

# Feature Flags
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_ANALYTICS=true
ENABLE_LOGGING=true
ENABLE_MONITORING=true
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
}

// Check current environment variables
console.log('\n📊 Current Environment Status:');
console.log('================================');

const requiredVars = [
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'MONGODB_URI',
  'JWT_SECRET'
];

const optionalVars = [
  'BASE_URL',
  'MNOTIFY_API_KEY',
  'ADMIN_PHONE',
  'ADMIN_EMAIL'
];

console.log('\n🔴 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '❌ NOT SET';
  console.log(`  ${varName}: ${status}`);
});

console.log('\n🟡 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '⚠️ NOT SET';
  console.log(`  ${varName}: ${status}`);
});

// Check Paystack configuration specifically
console.log('\n💳 Paystack Configuration:');
console.log('==========================');

const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
const paystackPublic = process.env.PAYSTACK_PUBLIC_KEY;

if (paystackSecret && paystackPublic) {
  console.log('✅ Paystack API keys are configured');
  
  // Check if they're test or live keys
  if (paystackSecret.startsWith('sk_test_')) {
    console.log('🧪 Using TEST keys (safe for development)');
  } else if (paystackSecret.startsWith('sk_live_')) {
    console.log('🚨 Using LIVE keys (be careful!)');
  } else {
    console.log('⚠️ Unknown key format');
  }
} else {
  console.log('❌ Paystack API keys are missing');
  console.log('   This will cause 500 errors on deposit requests');
  console.log('   Please set PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY');
}

// Instructions
console.log('\n📋 Next Steps:');
console.log('==============');

if (!paystackSecret || !paystackPublic) {
  console.log('1. 🔑 Get Paystack API keys from: https://dashboard.paystack.com/#/settings/developer');
  console.log('2. 📝 Add them to your .env file');
  console.log('3. 🔄 Restart your server');
} else {
  console.log('1. ✅ Environment is properly configured');
  console.log('2. 🚀 You can now test payment functionality');
}

console.log('\n💡 Tips:');
console.log('- Use test keys (sk_test_*) for development');
console.log('- Use live keys (sk_live_*) only in production');
console.log('- Never commit .env files to version control');
console.log('- Set up webhook URL in Paystack dashboard: http://localhost:5000/api/v1/paystack/webhook');

console.log('\n🎉 Setup complete!');
