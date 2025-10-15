// DataHustle Server Configuration Example
// Copy this file to config.js and fill in your actual values

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:5000'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Payment Gateway Configuration
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_paystack_secret_key',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key',
    baseUrl: 'https://api.paystack.co'
  },

  // SMS Configuration
  sms: {
    mnotify: {
      apiKey: process.env.MNOTIFY_API_KEY || 'your_mnotify_api_key',
      senderId: process.env.MNOTIFY_SENDER_ID || 'DataHustle',
      baseUrl: 'https://apps.mnotify.net/smsapi'
    },
    arkesel: {
      apiKey: process.env.ARKESEL_API_KEY || 'your_arkesel_api_key',
      baseUrl: 'https://sms.arkesel.com/sms/api'
    }
  },

  // API Integrations
  apis: {
    datamart: {
      apiKey: process.env.DATAMART_API_KEY || 'your_datamart_api_key',
      baseUrl: process.env.DATAMART_BASE_URL || 'https://api.datamartgh.shop'
    },
    geonettech: {
      apiKey: process.env.GEONETTECH_API_KEY || 'your_geonettech_api_key',
      baseUrl: process.env.GEONETTECH_BASE_URL || 'https://posapi.geonettech.com/api/v1'
    },
    telecel: {
      apiKey: process.env.TELECEL_API_KEY || 'your_telecel_api_key',
      baseUrl: process.env.TELECEL_API_URL || 'https://iget.onrender.com/api/developer/orders'
    },
    moolre: {
      apiUser: process.env.MOOLRE_API_USER || 'your_moolre_username',
      apiPubkey: process.env.MOOLRE_API_PUBKEY || 'your_moolre_public_key',
      apiKey: process.env.MOOLRE_API_KEY || 'your_moolre_private_key',
      accountNumber: process.env.MOOLRE_ACCOUNT_NUMBER || 'your_moolre_account_number',
      baseUrl: 'https://api.moolre.com'
    },
    textverified: {
      username: process.env.TEXTVERIFIED_API_USERNAME || 'your_textverified_username',
      apiKey: process.env.TEXTVERIFIED_API_KEY || 'your_textverified_api_key',
      baseUrl: 'https://www.textverified.com/api/pub/v2'
    }
  },

  // Security Configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    cors: {
      origins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://datahustle.shop',
        'https://www.datahustle.shop',
        'https://datahustlegh.com',
        'https://www.datahustlegh.com'
      ]
    }
  },

  // Admin Configuration
  admin: {
    phone: process.env.ADMIN_PHONE || '233XXXXXXXXX',
    email: process.env.ADMIN_EMAIL || 'admin@datahustle.shop'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    enableConsole: process.env.NODE_ENV !== 'production'
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },

  // Feature Flags
  features: {
    enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableLogging: process.env.ENABLE_LOGGING === 'true',
    enableMonitoring: process.env.ENABLE_MONITORING === 'true'
  },

  // Monitoring Configuration
  monitoring: {
    interval: parseInt(process.env.MONITORING_INTERVAL) || 30000, // 30 seconds
    healthCheckTimeout: 5000
  }
};
