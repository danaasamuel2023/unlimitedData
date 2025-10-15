const express = require('express');
const router = express.Router();
const { User, DataPurchase, Transaction, ReferralBonus,DataInventory } = require('../schema/schema');
const mongoose = require('mongoose');
const auth = require('../middlewareUser/middleware');
const adminAuth = require('../adminMiddleware/middleware');
const axios = require('axios');
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; 

// mNotify SMS configuration
const SMS_CONFIG = {
  API_KEY: process.env.MNOTIFY_API_KEY,
  SENDER_ID: 'DataMartGH',
  BASE_URL: 'https://apps.mnotify.net/smsapi'
};

/**
 * Format phone number to Ghana format for mNotify
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumberForMnotify = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If number starts with 0, replace with 233
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.substring(1);
  }
  
  // If number doesn't start with country code, add it
  if (!cleaned.startsWith('233')) {
    cleaned = '233' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send SMS notification using mNotify
 * @param {string} to - Recipient phone number
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - SMS API response
 */
const sendMnotifySMS = async (to, message) => {
  try {
    const formattedPhone = formatPhoneNumberForMnotify(to);
    
    // Validate phone number
    if (!formattedPhone || formattedPhone.length < 12) {
      throw new Error('Invalid phone number format');
    }
    
    // Construct SMS API URL
    const url = `${SMS_CONFIG.BASE_URL}?key=${SMS_CONFIG.API_KEY}&to=${formattedPhone}&msg=${encodeURIComponent(message)}&sender_id=${SMS_CONFIG.SENDER_ID}`;
    
    // Send SMS request
    const response = await axios.get(url);
    
    // Log the full response for debugging
    console.log('mNotify SMS API Response:', {
      status: response.status,
      data: response.data,
      dataType: typeof response.data
    });
    
    // Handle different response formats
    let responseCode;
    
    if (typeof response.data === 'number') {
      responseCode = response.data;
    } else if (typeof response.data === 'string') {
      const match = response.data.match(/\d+/);
      if (match) {
        responseCode = parseInt(match[0]);
      } else {
        responseCode = parseInt(response.data.trim());
      }
    } else if (typeof response.data === 'object' && response.data.code) {
      responseCode = parseInt(response.data.code);
    }
    
    if (isNaN(responseCode)) {
      console.error('Could not parse mNotify response code from:', response.data);
      if (response.status === 200) {
        return { success: true, message: 'SMS sent (assumed successful)', rawResponse: response.data };
      }
      throw new Error(`Invalid response format: ${JSON.stringify(response.data)}`);
    }
    
    // Handle response codes
    switch (responseCode) {
      case 1000:
        return { success: true, message: 'SMS sent successfully', code: responseCode };
      case 1002:
        throw new Error('SMS sending failed');
      case 1003:
        throw new Error('Insufficient SMS balance');
      case 1004:
        throw new Error('Invalid API key');
      case 1005:
        throw new Error('Invalid phone number');
      case 1006:
        throw new Error('Invalid Sender ID. Sender ID must not be more than 11 Characters');
      case 1007:
        return { success: true, message: 'SMS scheduled for later delivery', code: responseCode };
      case 1008:
        throw new Error('Empty message');
      case 1011:
        throw new Error('Numeric Sender IDs are not allowed');
      case 1012:
        throw new Error('Sender ID is not registered. Please contact support at senderids@mnotify.com');
      default:
        throw new Error(`Unknown response code: ${responseCode}`);
    }
  } catch (error) {
    if (error.response) {
      console.error('mNotify SMS API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    console.error('mNotify SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send credit confirmation SMS
 * @param {Object} user - User object
 * @param {number} amount - Credited amount
 * @param {number} newBalance - New wallet balance
 */
const sendCreditSMS = async (user, amount, newBalance) => {
  try {
    const message = `Hello ${user.name}! Your DataMartGH account has been credited with GHS ${amount.toFixed(2)}. Your new balance is GHS ${newBalance.toFixed(2)}. Thank you for choosing DataMartGH!`;
    
    const result = await sendMnotifySMS(user.phoneNumber, message);
    
    if (result.success) {
      console.log(`Credit SMS sent to ${user.phoneNumber}`);
    } else {
      console.error(`Failed to send credit SMS to ${user.phoneNumber}:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Send Credit SMS Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send debit notification SMS
 * @param {Object} user - User object
 * @param {number} amount - Debited amount
 * @param {number} newBalance - New wallet balance
 * @param {string} reason - Reason for deduction
 */
const sendDebitSMS = async (user, amount, newBalance, reason) => {
  try {
    const message = `DATAMART: GHS ${amount.toFixed(2)} has been deducted from your wallet. Your new balance is GHS ${newBalance.toFixed(2)}. Reason: ${reason || 'Administrative adjustment'}. For inquiries, contact support.`;
    
    const result = await sendMnotifySMS(user.phoneNumber, message);
    
    if (result.success) {
      console.log(`Debit SMS sent to ${user.phoneNumber}`);
    } else {
      console.error(`Failed to send debit SMS to ${user.phoneNumber}:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Send Debit SMS Error:', error);
    return { success: false, error: error.message };
  }
};

// Middleware to check if user is admin

// const mongoose = require('mongoose');
const ARKESEL_API_KEY = 'QkNhS0l2ZUZNeUdweEtmYVRUREg';

const sendSMS = async (phoneNumber, message, options = {}) => {
  const {
    scheduleTime = null,
    useCase = null,
    senderID = 'Bundle'
  } = options;

  // Input validation
  if (!phoneNumber || !message) {
    throw new Error('Phone number and message are required');
  }

  // Base parameters
  const params = {
    action: 'send-sms',
    api_key: ARKESEL_API_KEY,
    to: phoneNumber,
    from: senderID,
    sms: message
  };

  // Add optional parameters
  if (scheduleTime) {
    params.schedule = scheduleTime;
  }

  if (useCase && ['promotional', 'transactional'].includes(useCase)) {
    params.use_case = useCase;
  }

  // Add Nigerian use case if phone number starts with 234
  if (phoneNumber.startsWith('234') && !useCase) {
    params.use_case = 'transactional';
  }

  try {
    const response = await axios.get('https://sms.arkesel.com/sms/api', {
      params,
      timeout: 10000 // 10 second timeout
    });

    // Map error codes to meaningful messages
    const errorCodes = {
      '100': 'Bad gateway request',
      '101': 'Wrong action',
      '102': 'Authentication failed',
      '103': 'Invalid phone number',
      '104': 'Phone coverage not active',
      '105': 'Insufficient balance',
      '106': 'Invalid Sender ID',
      '109': 'Invalid Schedule Time',
      '111': 'SMS contains spam word. Wait for approval'
    };

    if (response.data.code !== 'ok') {
      const errorMessage = errorCodes[response.data.code] || 'Unknown error occurred';
      throw new Error(`SMS sending failed: ${errorMessage}`);
    }

    console.log('SMS sent successfully:', {
      to: phoneNumber,
      status: response.data.code,
      balance: response.data.balance,
      mainBalance: response.data.main_balance
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    // Handle specific error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('SMS API responded with error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from SMS API:', error.message);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('SMS request setup error:', error.message);
    }

    // Instead of swallowing the error, return error details
    return {
      success: false,
      error: {
        message: error.message,
        code: error.response?.data?.code,
        details: error.response?.data
      }
    };
  }
};


/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'walletBalance',  // ADD THIS
      sortOrder = 'desc'          // ADD THIS
    } = req.query;
    
    const searchQuery = search 
      ? { 
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { referralCode: { $regex: search, $options: 'i' } }
          ] 
        } 
      : {};
    
    // BUILD SORT OBJECT - ADD THIS
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const users = await User.find(searchQuery)
      .select('-password')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortObject)  // USE SORT OBJECT HERE
    
    const total = await User.countDocuments(searchQuery);
    
    res.json({
      users,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalUsers: total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/users/:id',auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  Admin
 */
router.put('/users/:id',auth, adminAuth, async (req, res) => {
  try {
    const { name, email, phoneNumber, role, walletBalance, referralCode } = req.body;
    
    // Build user object
    const userFields = {};
    if (name) userFields.name = name;
    if (email) userFields.email = email;
    if (phoneNumber) userFields.phoneNumber = phoneNumber;
    if (role) userFields.role = role;
    if (walletBalance !== undefined) userFields.walletBalance = walletBalance;
    if (referralCode) userFields.referralCode = referralCode;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/users/:id/add-money
 * @desc    Add money to user wallet with mNotify SMS
 * @access  Admin
 */
router.put('/users/:id/add-money',auth, adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find user and update wallet balance
      const user = await User.findById(req.params.id).session(session);
      
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Update wallet balance
      const previousBalance = user.walletBalance;
      user.walletBalance += parseFloat(amount);
      await user.save({ session });
      
      // Create transaction record
      const transaction = new Transaction({
        userId: user._id,
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'completed',
        reference: `ADMIN-${Date.now()}`,
        gateway: 'admin-deposit'
      });
      
      await transaction.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      // Send SMS notification using mNotify
      await sendCreditSMS(user, parseFloat(amount), user.walletBalance);
      
      res.json({
        msg: `Successfully added ${amount} to ${user.name}'s wallet`,
        currentBalance: user.walletBalance,
        previousBalance: previousBalance,
        transaction
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/**
 * @route   PUT /api/admin/users/:id/deduct-money
 * @desc    Deduct money from user wallet with mNotify SMS
 * @access  Admin
 */
router.put('/users/:id/deduct-money', auth, adminAuth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find user and update wallet balance
      const user = await User.findById(req.params.id).session(session);
      
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Check if user has sufficient balance
      if (user.walletBalance < parseFloat(amount)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          msg: 'Insufficient balance', 
          currentBalance: user.walletBalance,
          requestedDeduction: parseFloat(amount)
        });
      }
      
      // Update wallet balance
      const previousBalance = user.walletBalance;
      user.walletBalance -= parseFloat(amount);
      await user.save({ session });
      
      // Create transaction record
      const transaction = new Transaction({
        userId: user._id,
        type: 'withdrawal',
        amount: parseFloat(amount),
        status: 'completed',
        reference: `ADMIN-DEDUCT-${Date.now()}`,
        gateway: 'admin-deduction',
        metadata: {
          reason: reason || 'Administrative deduction',
          adminId: req.user.id,
          previousBalance: previousBalance
        }
      });
      
      await transaction.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      // Send SMS notification using mNotify
      await sendDebitSMS(user, parseFloat(amount), user.walletBalance, reason);
      
      res.json({
        msg: `Successfully deducted ${amount} from ${user.name}'s wallet`,
        currentBalance: user.walletBalance,
        previousBalance: previousBalance,
        transaction
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/users/:id',auth, adminAuth, async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check if user exists
      const user = await User.findById(req.params.id).session(session);
      
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Delete related records
      await Transaction.deleteMany({ userId: req.params.id }).session(session);
      await DataPurchase.deleteMany({ userId: req.params.id }).session(session);
      await ReferralBonus.deleteMany({ 
        $or: [
          { userId: req.params.id },
          { referredUserId: req.params.id }
        ]
      }).session(session);
      
      // Delete user
      await User.findByIdAndDelete(req.params.id).session(session);
      
      await session.commitTransaction();
      session.endSession();
      
      res.json({ msg: 'User and related data deleted' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all data purchase orders
 * @access  Admin
 */
/**
 * @route   GET /api/admin/orders
 * @desc    Get all data purchase orders with user phone search
 * @access  Admin
 */
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      status = '',
      network = '',
      startDate = '',
      endDate = '',
      phoneNumber = '',
      userPhone = ''  // New parameter for searching user's phone
    } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (network) filter.network = network;
    if (phoneNumber) filter.phoneNumber = { $regex: phoneNumber };
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        filter.createdAt.$lte = endDateObj;
      }
    }
    
    // If userPhone is provided, find users with that phone number first
    let userIds = null;
    if (userPhone) {
      const users = await User.find({
        phoneNumber: { $regex: userPhone, $options: 'i' }
      }).select('_id');
      
      userIds = users.map(user => user._id);
      
      if (userIds.length === 0) {
        // No users found with this phone number
        return res.json({
          orders: [],
          totalPages: 0,
          currentPage: parseInt(page),
          totalOrders: 0,
          totalRevenue: 0,
          message: 'No users found with this phone number'
        });
      }
      
      // Add user IDs to filter
      filter.userId = { $in: userIds };
    }
    
    const orders = await DataPurchase.find(filter)
      .populate('userId', 'name email phoneNumber')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await DataPurchase.countDocuments(filter);
    
    // Calculate total revenue from filtered orders
    const revenue = await DataPurchase.aggregate([
      { $match: filter },
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    // If searching by user phone and found results, also get user statistics
    let userStats = null;
    if (userPhone && userIds && userIds.length > 0) {
      const userStatsAgg = await DataPurchase.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
          $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0]
              }
            },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' }
      ]);
      
      userStats = userStatsAgg.map(stat => ({
        userId: stat._id,
        name: stat.userInfo.name,
        email: stat.userInfo.email,
        phoneNumber: stat.userInfo.phoneNumber,
        walletBalance: stat.userInfo.walletBalance,
        totalOrders: stat.totalOrders,
        completedOrders: stat.completedOrders,
        totalSpent: stat.totalSpent
      }));
    }
    
    res.json({
      orders,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalOrders: total,
      totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
      userStats // Include user statistics when searching by user phone
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status with mNotify SMS for refunds
 * @access  Admin
 */
router.put('/orders/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    // Validate status
    if (!['pending', 'waiting', 'processing', 'failed', 'shipped', 'delivered', 'completed'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    // Start a transaction for safety
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // First try to find by geonetReference (primary reference for orders)
      let order = await DataPurchase.findOne({ geonetReference: orderId })
        .populate('userId', 'name email phoneNumber walletBalance')
        .session(session);
      
      // If not found, try by MongoDB _id
      if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
        order = await DataPurchase.findById(orderId)
          .populate('userId', 'name email phoneNumber walletBalance')
          .session(session);
      }
      
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ msg: `Order with ID/Reference ${orderId} not found` });
      }
      
      const previousStatus = order.status;
      
      // Log the status change for audit trail
      console.log(`Order ${orderId} status change: ${previousStatus} -> ${status} by admin ${req.user.id}`);
      
      // Process refund if status is being changed to failed
      if (status === 'failed' && previousStatus !== 'failed') {
        // Only process refund if the order was previously not failed
        // Find the user and update their wallet balance
        const user = await User.findById(order.userId._id).session(session);
        
        if (user) {
          // Add the refund amount to the user's wallet balance
          const previousBalance = user.walletBalance;
          user.walletBalance += order.price;
          await user.save({ session });
          
          // Create refund transaction record
          const transaction = new Transaction({
            userId: user._id,
            type: 'refund',
            amount: order.price,
            status: 'completed',
            reference: `REFUND-${order._id}-${Date.now()}`,
            gateway: 'wallet-refund',
            metadata: {
              orderId: order._id,
              geonetReference: order.geonetReference,
              previousStatus,
              adminId: req.user.id
            }
          });
          
          await transaction.save({ session });
          
          console.log(`Refunded ${order.price} to user ${user._id} for order ${order._id}`);
          
          // Send refund SMS using mNotify
          try {
            const refundMessage = `Hello ${user.name}! Your DataMartGH account has been credited with a refund of GHS ${order.price.toFixed(2)} for your ${order.capacity}GB ${order.network} order. Your new balance is GHS ${user.walletBalance.toFixed(2)}. We apologize for any inconvenience.`;
            
            await sendMnotifySMS(user.phoneNumber, refundMessage);
          } catch (smsError) {
            console.error('Failed to send refund SMS:', smsError.message);
            // Continue even if SMS fails
          }
        }
      }
      
      // Update the order status
      order.status = status;
      order.processedBy = req.user.id;
      order.updatedAt = Date.now();
      
      // Add status history for tracking
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      
      order.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: req.user.id,
        previousStatus
      });
      
      await order.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.json({
        success: true,
        msg: 'Order status updated successfully',
        order: {
          id: order._id,
          geonetReference: order.geonetReference,
          status: order.status,
          previousStatus,
          updatedAt: order.updatedAt
        }
      });
    } catch (txError) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }
  } catch (err) {
    console.error(`Error updating order ${req.params.id} status:`, err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error while updating order status',
      error: err.message
    });
  }
});

/**
 * @route   POST /api/admin/orders/bulk-status-update
 * @desc    Bulk update order statuses with improved error handling
 * @access  Admin
 */
router.post('/orders/bulk-status-update', auth, adminAuth, async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ msg: 'Please provide an array of order IDs' });
    }
    
    if (!status || !['pending', 'waiting', 'processing', 'failed', 'shipped', 'delivered', 'completed'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    // Results tracking
    const results = {
      success: [],
      failed: [],
      notFound: []
    };
    
    // Process orders in batches to avoid overwhelming the database
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < orderIds.length; i += batchSize) {
      batches.push(orderIds.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      // Process each batch with a new session
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        for (const orderId of batch) {
          // First try to find by geonetReference
          let order = await DataPurchase.findOne({ geonetReference: orderId })
            .session(session);
          
          // If not found, try by MongoDB _id
          if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
            order = await DataPurchase.findById(orderId)
              .session(session);
          }
          
          if (!order) {
            results.notFound.push(orderId);
            continue;
          }
          
          const previousStatus = order.status;
          
          // Skip if status is already the target status
          if (previousStatus === status) {
            results.success.push({
              id: order._id,
              geonetReference: order.geonetReference,
              status,
              message: 'Status already set (no change needed)'
            });
            continue;
          }
          
          // Process refund if status is being changed to failed
          if (status === 'failed' && previousStatus !== 'failed') {
            try {
              // Only process refund if the order was previously not failed
              const user = await User.findById(order.userId).session(session);
              
              if (user) {
                // Add the refund amount to the user's wallet balance
                user.walletBalance += order.price;
                await user.save({ session });
                
                // Create refund transaction record
                const transaction = new Transaction({
                  userId: user._id,
                  type: 'refund',
                  amount: order.price,
                  status: 'completed',
                  reference: `REFUND-${order._id}-${Date.now()}`,
                  gateway: 'wallet-refund',
                  metadata: {
                    orderId: order._id,
                    geonetReference: order.geonetReference,
                    previousStatus,
                    bulkUpdate: true,
                    adminId: req.user.id
                  }
                });
                
                await transaction.save({ session });
                
                // Send refund SMS using mNotify
                try {
                  const refundMessage = `Hello ${user.name}! Your DataMartGH account has been credited with a refund of GHS ${order.price.toFixed(2)} for your ${order.capacity}GB ${order.network} order. Your new balance is GHS ${user.walletBalance.toFixed(2)}. We apologize for any inconvenience.`;
                  
                  await sendMnotifySMS(user.phoneNumber, refundMessage);
                } catch (smsError) {
                  console.error(`Failed to send refund SMS for order ${orderId}:`, smsError.message);
                  // Continue even if SMS fails
                }
              }
            } catch (refundError) {
              console.error(`Refund error for order ${orderId}:`, refundError.message);
              results.failed.push({
                id: order._id,
                geonetReference: order.geonetReference,
                error: 'Refund processing failed'
              });
              continue;
            }
          }
          
          // Update the order status
          order.status = status;
          order.processedBy = req.user.id;
          order.updatedAt = Date.now();
          
          // Add status history for tracking
          if (!order.statusHistory) {
            order.statusHistory = [];
          }
          
          order.statusHistory.push({
            status,
            changedAt: new Date(),
            changedBy: req.user.id,
            previousStatus,
            bulkUpdate: true
          });
          
          await order.save({ session });
          
          results.success.push({
            id: order._id,
            geonetReference: order.geonetReference,
            previousStatus,
            status
          });
        }
        
        // Commit the transaction for this batch
        await session.commitTransaction();
        session.endSession();
      } catch (batchError) {
        // If an error occurs in this batch, abort its transaction
        await session.abortTransaction();
        session.endSession();
        console.error('Error processing batch:', batchError.message);
        
        // Mark all orders in this batch as failed
        batch.forEach(orderId => {
          if (!results.success.some(s => s.id.toString() === orderId || s.geonetReference === orderId) && 
              !results.notFound.includes(orderId)) {
            results.failed.push({
              id: orderId,
              error: 'Batch transaction error'
            });
          }
        });
      }
    }
    
    // Send response with detailed results
    res.json({
      msg: `Bulk update processed. Success: ${results.success.length}, Failed: ${results.failed.length}, Not Found: ${results.notFound.length}`,
      results
    });
  } catch (err) {
    console.error('Bulk update error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error during bulk update',
      error: err.message
    });
  }
});

// Schema update to track status history
// Add this to your schema.js file to track order status changes
/*
const DataPurchaseSchema = new mongoose.Schema({
  // ... existing fields
  
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'waiting', 'processing', 'failed', 'shipped', 'delivered', 'completed'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousStatus: String,
    bulkUpdate: Boolean
  }]
});
*/

// Add these routes to your existing admin routes file

/**
 * @route   GET /api/admin/inventory
 * @desc    Get all inventory items with separate web/API status
 * @access  Admin
 */
router.get('/inventory', auth, adminAuth, async (req, res) => {
  try {
    const inventoryItems = await DataInventory.find({})
      .populate('webLastUpdatedBy', 'name email')
      .populate('apiLastUpdatedBy', 'name email')
      .sort({ network: 1 });
    
    // Predefined networks
    const NETWORKS = ["YELLO", "TELECEL", "AT_PREMIUM", "airteltigo", "at"];
    
    // Create response with all networks
    const inventory = NETWORKS.map(network => {
      const existingItem = inventoryItems.find(item => item.network === network);
      
      if (existingItem) {
        return {
          network: existingItem.network,
          // Web settings
          webInStock: existingItem.webInStock !== undefined ? existingItem.webInStock : existingItem.inStock,
          webSkipGeonettech: existingItem.webSkipGeonettech !== undefined ? existingItem.webSkipGeonettech : existingItem.skipGeonettech,
          webLastUpdatedBy: existingItem.webLastUpdatedBy,
          webLastUpdatedAt: existingItem.webLastUpdatedAt,
          // API settings
          apiInStock: existingItem.apiInStock !== undefined ? existingItem.apiInStock : existingItem.inStock,
          apiSkipGeonettech: existingItem.apiSkipGeonettech !== undefined ? existingItem.apiSkipGeonettech : existingItem.skipGeonettech,
          apiLastUpdatedBy: existingItem.apiLastUpdatedBy,
          apiLastUpdatedAt: existingItem.apiLastUpdatedAt,
          // Legacy fields
          inStock: existingItem.inStock,
          skipGeonettech: existingItem.skipGeonettech,
          // General
          updatedAt: existingItem.updatedAt
        };
      } else {
        // Return defaults for non-existent networks
        return {
          network,
          // Web defaults
          webInStock: true,
          webSkipGeonettech: false,
          webLastUpdatedBy: null,
          webLastUpdatedAt: null,
          // API defaults
          apiInStock: true,
          apiSkipGeonettech: false,
          apiLastUpdatedBy: null,
          apiLastUpdatedAt: null,
          // Legacy defaults
          inStock: true,
          skipGeonettech: false,
          updatedAt: null
        };
      }
    });
    
    res.json({
      status: 'success',
      inventory,
      totalNetworks: NETWORKS.length
    });
  } catch (err) {
    console.error('Get inventory error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inventory'
    });
  }
});

/**
 * @route   GET /api/admin/inventory/:network
 * @desc    Get specific network inventory with separate web/API info
 * @access  Admin
 */
router.get('/inventory/:network', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    const inventoryItem = await DataInventory.findOne({ network })
      .populate('webLastUpdatedBy', 'name email')
      .populate('apiLastUpdatedBy', 'name email');
    
    if (!inventoryItem) {
      return res.json({
        network,
        // Web defaults
        webInStock: true,
        webSkipGeonettech: false,
        webLastUpdatedBy: null,
        webLastUpdatedAt: null,
        // API defaults
        apiInStock: true,
        apiSkipGeonettech: false,
        apiLastUpdatedBy: null,
        apiLastUpdatedAt: null,
        // Legacy defaults
        inStock: true,
        skipGeonettech: false,
        updatedAt: null,
        message: 'Network not found in inventory - showing defaults'
      });
    }
    
    res.json({
      network: inventoryItem.network,
      // Web settings
      webInStock: inventoryItem.webInStock !== undefined ? inventoryItem.webInStock : inventoryItem.inStock,
      webSkipGeonettech: inventoryItem.webSkipGeonettech !== undefined ? inventoryItem.webSkipGeonettech : inventoryItem.skipGeonettech,
      webLastUpdatedBy: inventoryItem.webLastUpdatedBy,
      webLastUpdatedAt: inventoryItem.webLastUpdatedAt,
      // API settings
      apiInStock: inventoryItem.apiInStock !== undefined ? inventoryItem.apiInStock : inventoryItem.inStock,
      apiSkipGeonettech: inventoryItem.apiSkipGeonettech !== undefined ? inventoryItem.apiSkipGeonettech : inventoryItem.skipGeonettech,
      apiLastUpdatedBy: inventoryItem.apiLastUpdatedBy,
      apiLastUpdatedAt: inventoryItem.apiLastUpdatedAt,
      // Legacy fields
      inStock: inventoryItem.inStock,
      skipGeonettech: inventoryItem.skipGeonettech,
      updatedAt: inventoryItem.updatedAt
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/inventory/:network/toggle-web
 * @desc    Toggle web stock status
 * @access  Admin
 */
router.put('/inventory/:network/toggle-web', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    let inventory = await DataInventory.findOne({ network });
    
    if (!inventory) {
      // Create new inventory record with default values
      inventory = new DataInventory({
        network,
        webInStock: false, // Toggling from default true
        apiInStock: true,
        webSkipGeonettech: false,
        apiSkipGeonettech: false,
        // Set legacy fields to match web settings initially
        inStock: false,
        skipGeonettech: false
      });
    } else {
      // Toggle web stock status
      if (inventory.webInStock !== undefined) {
        inventory.webInStock = !inventory.webInStock;
      } else {
        // If webInStock doesn't exist, use legacy inStock field
        inventory.webInStock = !inventory.inStock;
      }
    }
    
    inventory.webLastUpdatedBy = req.user.id;
    inventory.webLastUpdatedAt = new Date();
    inventory.updatedAt = new Date();
    
    await inventory.save();
    
    res.json({
      status: 'success',
      message: `${network} web stock status updated to ${inventory.webInStock ? 'In Stock' : 'Out of Stock'}`,
      webInStock: inventory.webInStock,
      webLastUpdatedAt: inventory.webLastUpdatedAt
    });
  } catch (error) {
    console.error('Toggle web stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle web stock status'
    });
  }
});

/**
 * @route   PUT /api/admin/inventory/:network/toggle-api
 * @desc    Toggle API stock status
 * @access  Admin
 */
router.put('/inventory/:network/toggle-api', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    let inventory = await DataInventory.findOne({ network });
    
    if (!inventory) {
      inventory = new DataInventory({
        network,
        webInStock: true,
        apiInStock: false, // Toggling from default true
        webSkipGeonettech: false,
        apiSkipGeonettech: false,
        // Set legacy fields
        inStock: true,
        skipGeonettech: false
      });
    } else {
      // Toggle API stock status
      if (inventory.apiInStock !== undefined) {
        inventory.apiInStock = !inventory.apiInStock;
      } else {
        // If apiInStock doesn't exist, use legacy inStock field
        inventory.apiInStock = !inventory.inStock;
      }
    }
    
    inventory.apiLastUpdatedBy = req.user.id;
    inventory.apiLastUpdatedAt = new Date();
    inventory.updatedAt = new Date();
    
    await inventory.save();
    
    res.json({
      status: 'success',
      message: `${network} API stock status updated to ${inventory.apiInStock ? 'In Stock' : 'Out of Stock'}`,
      apiInStock: inventory.apiInStock,
      apiLastUpdatedAt: inventory.apiLastUpdatedAt
    });
  } catch (error) {
    console.error('Toggle API stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle API stock status'
    });
  }
});

/**
 * @route   PUT /api/admin/inventory/:network/toggle-geonettech-web
 * @desc    Toggle web Geonettech API status
 * @access  Admin
 */
router.put('/inventory/:network/toggle-geonettech-web', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    let inventory = await DataInventory.findOne({ network });
    
    if (!inventory) {
      inventory = new DataInventory({
        network,
        webInStock: true,
        apiInStock: true,
        webSkipGeonettech: true, // Toggling from default false
        apiSkipGeonettech: false,
        // Set legacy fields
        inStock: true,
        skipGeonettech: true
      });
    } else {
      // Toggle web Geonettech status
      if (inventory.webSkipGeonettech !== undefined) {
        inventory.webSkipGeonettech = !inventory.webSkipGeonettech;
      } else {
        // If webSkipGeonettech doesn't exist, use legacy skipGeonettech field
        inventory.webSkipGeonettech = !inventory.skipGeonettech;
      }
    }
    
    inventory.webLastUpdatedBy = req.user.id;
    inventory.webLastUpdatedAt = new Date();
    inventory.updatedAt = new Date();
    
    await inventory.save();
    
    res.json({
      status: 'success',
      message: `${network} web Geonettech API ${inventory.webSkipGeonettech ? 'disabled' : 'enabled'}`,
      webSkipGeonettech: inventory.webSkipGeonettech,
      webLastUpdatedAt: inventory.webLastUpdatedAt
    });
  } catch (error) {
    console.error('Toggle web Geonettech error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle web Geonettech status'
    });
  }
});

/**
 * @route   PUT /api/admin/inventory/:network/toggle-geonettech-api
 * @desc    Toggle API Geonettech status
 * @access  Admin
 */
router.put('/inventory/:network/toggle-geonettech-api', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    let inventory = await DataInventory.findOne({ network });
    
    if (!inventory) {
      inventory = new DataInventory({
        network,
        webInStock: true,
        apiInStock: true,
        webSkipGeonettech: false,
        apiSkipGeonettech: true, // Toggling from default false
        // Set legacy fields
        inStock: true,
        skipGeonettech: false
      });
    } else {
      // Toggle API Geonettech status
      if (inventory.apiSkipGeonettech !== undefined) {
        inventory.apiSkipGeonettech = !inventory.apiSkipGeonettech;
      } else {
        // If apiSkipGeonettech doesn't exist, use legacy skipGeonettech field
        inventory.apiSkipGeonettech = !inventory.skipGeonettech;
      }
    }
    
    inventory.apiLastUpdatedBy = req.user.id;
    inventory.apiLastUpdatedAt = new Date();
    inventory.updatedAt = new Date();
    
    await inventory.save();
    
    res.json({
      status: 'success',
      message: `${network} API Geonettech ${inventory.apiSkipGeonettech ? 'disabled' : 'enabled'}`,
      apiSkipGeonettech: inventory.apiSkipGeonettech,
      apiLastUpdatedAt: inventory.apiLastUpdatedAt
    });
  } catch (error) {
    console.error('Toggle API Geonettech error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle API Geonettech status'
    });
  }
});

/**
 * @route   POST /api/admin/inventory/migrate
 * @desc    Migrate existing inventory to new schema
 * @access  Admin
 */
router.post('/inventory/migrate', auth, adminAuth, async (req, res) => {
  try {
    const inventories = await DataInventory.find({});
    let migratedCount = 0;
    
    for (const inventory of inventories) {
      let updated = false;
      
      // If new fields don't exist, copy from old fields
      if (inventory.webInStock === undefined) {
        inventory.webInStock = inventory.inStock;
        updated = true;
      }
      if (inventory.webSkipGeonettech === undefined) {
        inventory.webSkipGeonettech = inventory.skipGeonettech;
        updated = true;
      }
      if (inventory.apiInStock === undefined) {
        inventory.apiInStock = inventory.inStock;
        updated = true;
      }
      if (inventory.apiSkipGeonettech === undefined) {
        inventory.apiSkipGeonettech = inventory.skipGeonettech;
        updated = true;
      }
      
      if (updated) {
        await inventory.save();
        migratedCount++;
      }
    }
    
    res.json({
      status: 'success',
      message: `Migration completed. ${migratedCount} out of ${inventories.length} inventory records updated.`,
      totalRecords: inventories.length,
      migratedRecords: migratedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to migrate inventory'
    });
  }
});

// Keep the legacy toggle routes for backward compatibility
// But update them to affect both web and API settings

/**
 * @route   PUT /api/admin/inventory/:network/toggle
 * @desc    Toggle stock status (legacy - affects both web and API)
 * @access  Admin
 */
router.put('/inventory/:network/toggle', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    let inventoryItem = await DataInventory.findOne({ network });
    
    if (!inventoryItem) {
      inventoryItem = new DataInventory({
        network,
        inStock: false,
        webInStock: false,
        apiInStock: false,
        skipGeonettech: false,
        webSkipGeonettech: false,
        apiSkipGeonettech: false
      });
    } else {
      // Toggle all stock statuses
      inventoryItem.inStock = !inventoryItem.inStock;
      inventoryItem.webInStock = inventoryItem.inStock;
      inventoryItem.apiInStock = inventoryItem.inStock;
      inventoryItem.updatedAt = Date.now();
    }
    
    await inventoryItem.save();
    
    res.json({ 
      network: inventoryItem.network, 
      inStock: inventoryItem.inStock,
      webInStock: inventoryItem.webInStock,
      apiInStock: inventoryItem.apiInStock,
      skipGeonettech: inventoryItem.skipGeonettech || false,
      message: `${network} is now ${inventoryItem.inStock ? 'in stock' : 'out of stock'} for both web and API`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/inventory/:network/toggle-geonettech
 * @desc    Toggle Geonettech API (legacy - affects both web and API)
 * @access  Admin
 */
router.put('/inventory/:network/toggle-geonettech', auth, adminAuth, async (req, res) => {
  try {
    const { network } = req.params;
    
    let inventoryItem = await DataInventory.findOne({ network });
    
    if (!inventoryItem) {
      inventoryItem = new DataInventory({
        network,
        inStock: true,
        webInStock: true,
        apiInStock: true,
        skipGeonettech: true,
        webSkipGeonettech: true,
        apiSkipGeonettech: true
      });
    } else {
      // Toggle all Geonettech settings
      inventoryItem.skipGeonettech = !inventoryItem.skipGeonettech;
      inventoryItem.webSkipGeonettech = inventoryItem.skipGeonettech;
      inventoryItem.apiSkipGeonettech = inventoryItem.skipGeonettech;
      inventoryItem.updatedAt = Date.now();
    }
    
    await inventoryItem.save();
    
    res.json({ 
      network: inventoryItem.network, 
      inStock: inventoryItem.inStock,
      skipGeonettech: inventoryItem.skipGeonettech,
      webSkipGeonettech: inventoryItem.webSkipGeonettech,
      apiSkipGeonettech: inventoryItem.apiSkipGeonettech,
      message: `${network} Geonettech API is now ${inventoryItem.skipGeonettech ? 'disabled' : 'enabled'} for both web and API`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions with pagination, filtering and sorting
 * @access  Admin
 */
router.get('/transactions', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      type = '',
      status = '',
      gateway = '',
      startDate = '',
      endDate = '',
      search = '',
      phoneNumber = '' // Add phoneNumber parameter
    } = req.query;
    
    // Build filter
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;
    
    // Search by reference or userId
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.userId = search;
      } else {
        filter.reference = { $regex: search, $options: 'i' };
      }
    }

    // Phone number search - use aggregation to find users by phone
    let userIdsByPhone = [];
    if (phoneNumber) {
      const users = await User.find({
        phoneNumber: { $regex: phoneNumber, $options: 'i' }
      }).select('_id');
      
      userIdsByPhone = users.map(user => user._id);
      
      if (userIdsByPhone.length > 0) {
        filter.userId = { $in: userIdsByPhone };
      } else {
        // No users with this phone number, return empty result
        return res.json({
          transactions: [],
          totalPages: 0,
          currentPage: parseInt(page),
          totalTransactions: 0,
          amountByType: {}
        });
      }
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1); // Include end date until midnight
        filter.createdAt.$lte = endDateObj;
      }
    }
    
    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email phoneNumber')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Transaction.countDocuments(filter);
    
    // Calculate total transaction amount for filtered transactions
    const totalAmount = await Transaction.aggregate([
      { $match: filter },
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Format the totals by type (deposit, payment, etc.)
    const amountByType = {};
    totalAmount.forEach(item => {
      amountByType[item._id] = item.total;
    });
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalTransactions: total,
      amountByType
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
/**
 * @route   GET /api/admin/transactions/:id
 * @desc    Get transaction details by ID
 * @access  Admin
 */
router.get('/transactions/:id', auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email phoneNumber');
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/admin/verify-paystack/:reference
 * @desc    Verify payment status from Paystack
 * @access  Admin
 */
router.get('/verify-paystack/:reference', auth, adminAuth, async (req, res) => {
  try {
    const { reference } = req.params;
    
    // First check if transaction exists in our database
    const transaction = await Transaction.findOne({ reference })
      .populate('userId', 'name email phoneNumber');
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction reference not found in database' });
    }
    
    // Only verify Paystack transactions
    if (transaction.gateway !== 'paystack') {
      return res.status(400).json({ 
        msg: 'This transaction was not processed through Paystack',
        transaction
      });
    }
    
    // Verify with Paystack API
    try {
      const paystackResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const paystackData = paystackResponse.data;
      
      // Update transaction status based on Paystack response
      if (paystackData.status && paystackData.data.status === 'success') {
        // Update transaction in database if needed
        if (transaction.status !== 'completed') {
          transaction.status = 'completed';
          transaction.metadata = {
            ...transaction.metadata,
            paystackVerification: paystackData.data
          };
          await transaction.save();
        }
        
        return res.json({
          transaction,
          paystackVerification: paystackData.data,
          verified: true,
          message: 'Payment was successfully verified on Paystack'
        });
      } else {
        // Update transaction in database if needed
        if (transaction.status !== 'failed') {
          transaction.status = 'failed';
          transaction.metadata = {
            ...transaction.metadata,
            paystackVerification: paystackData.data
          };
          await transaction.save();
        }
        
        return res.json({
          transaction,
          paystackVerification: paystackData.data,
          verified: false,
          message: 'Payment verification failed on Paystack'
        });
      }
    } catch (verifyError) {
      console.error('Paystack verification error:', verifyError.message);
      return res.status(500).json({
        msg: 'Error verifying payment with Paystack',
        error: verifyError.message,
        transaction
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/admin/transactions/:id/update-status
 * @desc    Manually update transaction status
 * @access  Admin
 */
router.put('/transactions/:id/update-status', auth, adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!['pending', 'completed', 'failed', 'processing', 'refunded'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    // Update transaction fields
    transaction.status = status;
    transaction.updatedAt = Date.now();
    
    // Add admin notes if provided
    if (adminNotes) {
      transaction.metadata = {
        ...transaction.metadata,
        adminNotes,
        updatedBy: req.user.id,
        updateDate: new Date()
      };
    }
    
    await transaction.save();
    
    res.json({
      msg: 'Transaction status updated successfully',
      transaction
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).send('Server Error');
  }
});

router.put('/users/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const { disableReason } = req.body;
    const userId = req.params.id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Get current admin for tracking
    const admin = await User.findById(req.user.id).select('name');
    
    // Toggle the isDisabled status
    user.isDisabled = !user.isDisabled;
    
    // Update related fields
    if (user.isDisabled) {
      // Disabling the account
      user.disableReason = disableReason || 'Administrative action';
      user.disabledAt = new Date();
      user.disabledBy = req.user.id;
    } else {
      // Re-enabling the account
      user.disableReason = null;
      user.disabledAt = null;
      user.enabledBy = req.user.id;
      user.enabledAt = new Date();
    }
    
    await user.save();
    
    // Send notification SMS to the user using mNotify
    try {
      if (user.phoneNumber) {
        let message;
        
        if (user.isDisabled) {
          message = `DATAMART: Your account has been disabled. Reason: ${user.disableReason}. Contact support for assistance.`;
        } else {
          message = `DATAMART: Your account has been re-enabled. You can now access all platform features. Thank you for choosing DATAMART.`;
        }
        
        await sendMnotifySMS(user.phoneNumber, message);
      }
    } catch (smsError) {
      console.error('Failed to send account status SMS:', smsError.message);
      // Continue even if SMS fails
    }
    
    return res.json({
      success: true,
      message: user.isDisabled ? 'User account has been disabled' : 'User account has been enabled',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isDisabled: user.isDisabled,
        disableReason: user.disableReason,
        disabledAt: user.disabledAt,
        disabledBy: admin ? admin.name : req.user.id
      }
    });
    
  } catch (err) {
    console.error('Toggle user status error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Enhanced daily summary route with FIXED balance calculation
// Replace the transaction search section (starting around line 770) with this optimized version:

router.get('/daily-summary', auth, adminAuth, async (req, res) => {
  try {
    const { 
      date = new Date().toISOString().split('T')[0],
      search = '',
      phoneNumber = '',
      email = '',
      reference = '',
      gateway = '',
      transactionType = '',
      transactionStatus = '',
      userId = '',
      transactionPage = 1,
      transactionLimit = 20
    } = req.query;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    };
    
    // === DATA PURCHASE ANALYTICS (keep existing code) ===
    const totalOrders = await DataPurchase.countDocuments(dateFilter);
    
    const revenueAgg = await DataPurchase.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;
    
    const capacityByNetworkAgg = await DataPurchase.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { 
        $group: { 
          _id: {
            network: '$network',
            capacity: '$capacity'
          },
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' }
        }
      },
      { $sort: { '_id.network': 1, '_id.capacity': 1 } }
    ]);
    
    const capacityData = capacityByNetworkAgg.map(item => ({
      network: item._id.network,
      capacity: item._id.capacity,
      count: item.count,
      totalGB: item.totalCapacity
    }));
    
    const networkSummaryAgg = await DataPurchase.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { 
        $group: { 
          _id: '$network',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalRevenue: { $sum: '$price' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    const networkSummary = networkSummaryAgg.map(item => ({
      network: item._id,
      count: item.count,
      totalGB: item.totalCapacity,
      revenue: item.totalRevenue
    }));
    
    const totalCapacityAgg = await DataPurchase.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, totalGB: { $sum: '$capacity' } } }
    ]);
    const totalCapacity = totalCapacityAgg.length > 0 ? totalCapacityAgg[0].totalGB : 0;
    
    const statusSummaryAgg = await DataPurchase.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const statusSummary = statusSummaryAgg.map(item => ({
      status: item._id,
      count: item.count
    }));
    
    // === DEPOSIT ANALYTICS (keep existing code) ===
    const depositFilter = {
      ...dateFilter,
      type: 'deposit',
      status: 'completed'
    };
    
    const depositSummaryAgg = await Transaction.aggregate([
      { $match: depositFilter },
      { 
        $group: { 
          _id: null, 
          totalDeposits: { $sum: '$amount' },
          depositCount: { $sum: 1 },
          averageDeposit: { $avg: '$amount' }
        }
      }
    ]);
    
    const depositSummary = depositSummaryAgg.length > 0 ? depositSummaryAgg[0] : {
      totalDeposits: 0,
      depositCount: 0,
      averageDeposit: 0
    };
    
    const depositsByGatewayAgg = await Transaction.aggregate([
      { $match: depositFilter },
      { 
        $group: { 
          _id: '$gateway',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    const depositsByGateway = depositsByGatewayAgg.map(item => ({
      gateway: item._id || 'unknown',
      count: item.count,
      totalAmount: item.totalAmount,
      averageAmount: item.averageAmount
    }));
    
    const topDepositorsAgg = await Transaction.aggregate([
      { $match: depositFilter },
      {
        $group: {
          _id: '$userId',
          totalDeposited: { $sum: '$amount' },
          depositCount: { $sum: 1 },
          averageDeposit: { $avg: '$amount' },
          firstDeposit: { $min: '$createdAt' },
          lastDeposit: { $max: '$createdAt' }
        }
      },
      { $sort: { totalDeposited: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' }
    ]);
    
    const topDepositors = topDepositorsAgg.map(depositor => ({
      userId: depositor._id,
      name: depositor.userDetails.name,
      email: depositor.userDetails.email,
      phoneNumber: depositor.userDetails.phoneNumber,
      totalDeposited: depositor.totalDeposited,
      depositCount: depositor.depositCount,
      averageDeposit: depositor.averageDeposit,
      firstDeposit: depositor.firstDeposit,
      lastDeposit: depositor.lastDeposit
    }));
    
    const hourlyDepositPattern = await Transaction.aggregate([
      { $match: depositFilter },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    const depositHours = hourlyDepositPattern.map(hour => ({
      hour: hour._id,
      count: hour.count,
      amount: hour.totalAmount
    }));
    
    // === OPTIMIZED TRANSACTION SEARCH ===
    
    // Build base transaction filter - ALWAYS filter by date first
    const transactionMatchConditions = {
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    };
    
    // Add additional filters
    if (transactionType) transactionMatchConditions.type = transactionType;
    if (transactionStatus) transactionMatchConditions.status = transactionStatus;
    if (gateway) transactionMatchConditions.gateway = gateway;
    if (reference) transactionMatchConditions.reference = { $regex: reference, $options: 'i' };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      transactionMatchConditions.userId = mongoose.Types.ObjectId(userId);
    }
    
    // Handle phone/email search by finding users first
    let userIdsFromSearch = null;
    if (phoneNumber || email || search) {
      const userSearchQuery = {};
      
      if (phoneNumber) {
        userSearchQuery.phoneNumber = { $regex: phoneNumber, $options: 'i' };
      }
      if (email) {
        userSearchQuery.email = { $regex: email, $options: 'i' };
      }
      if (search) {
        userSearchQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      const users = await User.find(userSearchQuery).select('_id');
      userIdsFromSearch = users.map(u => u._id);
      
      if (userIdsFromSearch.length === 0) {
        // No matching users found
        return res.json({
          date,
          summary: {
            totalOrders,
            totalRevenue,
            totalDeposits: depositSummary.totalDeposits,
            totalCapacityGB: totalCapacity
          },
          networkSummary,
          capacityDetails: capacityData,
          statusSummary,
          depositAnalytics: {
            summary: depositSummary,
            byGateway: depositsByGateway,
            topDepositors,
            hourlyPattern: depositHours
          },
          transactionManagement: {
            searchResults: {
              transactions: [],
              totalTransactions: 0,
              currentPage: parseInt(transactionPage),
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false
            },
            filters: {
              search,
              phoneNumber,
              email,
              reference,
              gateway,
              transactionType,
              transactionStatus,
              userId
            }
          }
        });
      }
      
      // Add user IDs to transaction filter
      if (transactionMatchConditions.userId) {
        // If userId already specified, ensure it's in the search results
        transactionMatchConditions.userId = {
          $in: [transactionMatchConditions.userId, ...userIdsFromSearch]
        };
      } else {
        transactionMatchConditions.userId = { $in: userIdsFromSearch };
      }
    }
    
    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(transactionMatchConditions);
    
    // Fetch transactions with user details (simplified - no balance calculation)
    const transactions = await Transaction.find(transactionMatchConditions)
      .populate('userId', 'name email phoneNumber walletBalance')
      .sort({ createdAt: -1 })
      .skip((parseInt(transactionPage) - 1) * parseInt(transactionLimit))
      .limit(parseInt(transactionLimit))
      .lean();
    
    // Format transactions with current wallet balance
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      reference: transaction.reference,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      gateway: transaction.gateway,
      createdAt: transaction.createdAt,
      balanceAfterTransaction: transaction.userId?.walletBalance || 0, // Current balance
      user: transaction.userId ? {
        id: transaction.userId._id,
        name: transaction.userId.name,
        email: transaction.userId.email,
        phoneNumber: transaction.userId.phoneNumber,
        currentWalletBalance: transaction.userId.walletBalance
      } : null,
      metadata: transaction.metadata
    }));
    
    // === CUSTOMER ANALYTICS ===
    const uniqueCustomersAgg = await DataPurchase.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$userId' } },
      { $count: 'uniqueCustomers' }
    ]);
    
    const uniqueCustomersFromDeposits = await Transaction.aggregate([
      { $match: depositFilter },
      { $group: { _id: '$userId' } },
      { $count: 'uniqueDepositors' }
    ]);
    
    const uniqueCustomers = uniqueCustomersAgg.length > 0 ? uniqueCustomersAgg[0].uniqueCustomers : 0;
    const uniqueDepositors = uniqueCustomersFromDeposits.length > 0 ? uniqueCustomersFromDeposits[0].uniqueDepositors : 0;
    
    // === PAYSTACK & ADMIN SUMMARIES ===
    const paystackTransactions = await Transaction.find({
      ...dateFilter,
      gateway: 'paystack'
    });
    
    const paystackSummary = {
      total: paystackTransactions.length,
      completed: paystackTransactions.filter(t => t.status === 'completed').length,
      pending: paystackTransactions.filter(t => t.status === 'pending').length,
      failed: paystackTransactions.filter(t => t.status === 'failed').length,
      totalAmount: paystackTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
    };
    
    const adminTransactions = await Transaction.find({
      ...dateFilter,
      $or: [
        { gateway: 'admin-deposit' },
        { gateway: 'admin-deduction' },
        { type: 'refund' }
      ]
    });
    
    const adminSummary = {
      total: adminTransactions.length,
      deposits: adminTransactions.filter(t => t.gateway === 'admin-deposit').length,
      deductions: adminTransactions.filter(t => t.gateway === 'admin-deduction').length,
      refunds: adminTransactions.filter(t => t.type === 'refund').length,
      totalAdminDeposits: adminTransactions
        .filter(t => t.gateway === 'admin-deposit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalAdminDeductions: adminTransactions
        .filter(t => t.gateway === 'admin-deduction')
        .reduce((sum, t) => sum + t.amount, 0),
      totalRefunds: adminTransactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0)
    };
    
    // Final response
    res.json({
      date,
      summary: {
        totalOrders,
        totalRevenue,
        totalDeposits: depositSummary.totalDeposits,
        totalCapacityGB: totalCapacity,
        uniqueCustomers,
        depositCount: depositSummary.depositCount,
        averageDeposit: depositSummary.averageDeposit,
        uniqueDepositors
      },
      networkSummary,
      capacityDetails: capacityData,
      statusSummary,
      depositAnalytics: {
        summary: depositSummary,
        byGateway: depositsByGateway,
        topDepositors,
        hourlyPattern: depositHours
      },
      transactionManagement: {
        searchResults: {
          transactions: formattedTransactions,
          totalTransactions,
          currentPage: parseInt(transactionPage),
          totalPages: Math.ceil(totalTransactions / parseInt(transactionLimit)),
          hasNextPage: parseInt(transactionPage) < Math.ceil(totalTransactions / parseInt(transactionLimit)),
          hasPrevPage: parseInt(transactionPage) > 1
        },
        paystackSummary,
        adminSummary,
        filters: {
          search,
          phoneNumber,
          email,
          reference,
          gateway,
          transactionType,
          transactionStatus,
          userId
        }
      },
      businessInsights: {
        peakDepositHour: depositHours.length > 0 ? depositHours.reduce((max, hour) => hour.amount > max.amount ? hour : max, depositHours[0]) : null,
        topGateway: depositsByGateway.length > 0 ? depositsByGateway[0] : null,
        customerEngagement: {
          totalCustomers: uniqueCustomers,
          depositingCustomers: uniqueDepositors
        }
      }
    });
    
  } catch (err) {
    console.error('Enhanced dashboard error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching enhanced dashboard data',
      error: err.message
    });
  }
});
router.get('/user-orders/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Fetch orders for the user
    const orders = await DataPurchase.find({ userId })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await DataPurchase.countDocuments({ userId });
    
    // Calculate total spent by the user
    const totalSpent = await DataPurchase.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalOrders: total,
      totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
    });
  } catch (err) {
    console.error('Error fetching user orders:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/admin/dashboard/statistics
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/dashboard/statistics', auth, adminAuth, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get total wallet balance across all users
    const walletBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    const totalWalletBalance = walletBalance.length > 0 ? walletBalance[0].total : 0;
    
    // Get total completed orders
    const completedOrders = await DataPurchase.countDocuments({ status: 'completed' });
    
    // Get total revenue from completed orders
    const revenue = await DataPurchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
    
    // Get total by network
    const networkStats = await DataPurchase.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: { 
          _id: '$network',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    // Get recent orders
    const recentOrders = await DataPurchase.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');
    
    res.json({
      userStats: {
        totalUsers,
        totalWalletBalance
      },
      orderStats: {
        totalOrders: await DataPurchase.countDocuments(),
        completedOrders,
        pendingOrders: await DataPurchase.countDocuments({ status: 'pending' }),
        failedOrders: await DataPurchase.countDocuments({ status: 'failed' })
      },
      financialStats: {
        totalRevenue,
        averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0
      },
      networkStats,
      recentOrders
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;