const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./schema/schema');

// Database connection
const MONGODB_URI = 'mongodb+srv://dajounimarket:0246783840Sa@cluster0.kp8c2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'sunumanfred14@gmail.com',
  password: 'Kingfred4190$',
  phoneNumber: '0503276136',
  role: 'admin',
  walletBalance: 0,
  approvalStatus: 'approved',
  isDisabled: false
};

async function setupAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // First, check if a user with the target email exists
    const existingUserWithEmail = await User.findOne({ email: adminUser.email });
    
    if (existingUserWithEmail) {
      console.log('👤 Found existing user with email:', adminUser.email);
      console.log('🔄 Updating existing user to admin...');
      
      // Update the existing user to be an admin
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      existingUserWithEmail.name = adminUser.name;
      existingUserWithEmail.password = hashedPassword;
      existingUserWithEmail.phoneNumber = adminUser.phoneNumber;
      existingUserWithEmail.role = 'admin';
      existingUserWithEmail.approvalStatus = 'approved';
      existingUserWithEmail.isDisabled = false;
      existingUserWithEmail.approvedAt = new Date();
      
      await existingUserWithEmail.save();
      console.log('✅ Existing user updated to admin successfully!');
      
    } else {
      // Check if any admin user exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      
      if (existingAdmin) {
        console.log('⚠️  Another admin user already exists with email:', existingAdmin.email);
        console.log('🔄 Updating existing admin user with new credentials...');
        
        // Update existing admin user
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);
        
        existingAdmin.name = adminUser.name;
        existingAdmin.email = adminUser.email;
        existingAdmin.password = hashedPassword;
        existingAdmin.phoneNumber = adminUser.phoneNumber;
        existingAdmin.role = 'admin';
        existingAdmin.approvalStatus = 'approved';
        existingAdmin.isDisabled = false;
        existingAdmin.approvedAt = new Date();
        
        await existingAdmin.save();
        console.log('✅ Existing admin user updated with new credentials!');
        
      } else {
        // Create new admin user
        console.log('👤 Creating new admin user...');
        
        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);
        
        // Generate referral code
        const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
        const referralCode = generateReferralCode();
        
        // Create admin user
        const newAdmin = new User({
          name: adminUser.name,
          email: adminUser.email,
          password: hashedPassword,
          phoneNumber: adminUser.phoneNumber,
          role: adminUser.role,
          walletBalance: adminUser.walletBalance,
          referralCode: referralCode,
          approvalStatus: adminUser.approvalStatus,
          isDisabled: adminUser.isDisabled,
          approvedBy: null, // Self-approved
          approvedAt: new Date()
        });
        
        await newAdmin.save();
        console.log('✅ New admin user created successfully!');
      }
    }
    
    // Verify the admin user was created/updated
    const finalAdmin = await User.findOne({ email: adminUser.email });
    
    if (finalAdmin && finalAdmin.role === 'admin') {
      console.log('\n🎉 Admin User Setup Complete!');
      console.log('=' .repeat(50));
      console.log('📧 Email: sunumanfred14@gmail.com');
      console.log('🔑 Password: Kingfred4190$');
      console.log('👤 Role: admin');
      console.log('✅ Status: approved');
      console.log('📱 Phone: 0503276136');
      console.log('=' .repeat(50));
      console.log('\n🌐 You can now login to the admin panel using these credentials.');
      console.log('🔗 Admin endpoints:');
      console.log('   - /api/admin/users');
      console.log('   - /api/orders/admin-orders');
      console.log('   - /api/reports/summary');
      console.log('   - /api/approve-user/:userId');
      console.log('\n💡 To login:');
      console.log('   1. Go to your login page');
      console.log('   2. Use email: sunumanfred14@gmail.com');
      console.log('   3. Use password: Kingfred4190$');
      console.log('   4. You will have admin access to all admin features');
    } else {
      console.log('❌ Failed to verify admin user creation');
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
setupAdminUser();
