# DataHustle Server

A comprehensive Node.js API server for data bundle purchases, user management, and payment processing in Ghana.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 📱 **Data Bundle Purchases**: Support for MTN, AirtelTigo, and Telecel networks
- 💳 **Payment Processing**: Paystack integration for secure payments
- 📧 **SMS Notifications**: Bulk SMS sending with mNotify and Arkesel
- 📞 **Phone Verification**: TextVerified integration for phone number verification
- 👥 **User Management**: Complete user registration, approval, and management system
- 📊 **Admin Dashboard**: Comprehensive admin panel with reporting and analytics
- 🔧 **Developer API**: RESTful API for third-party integrations
- 📈 **Real-time Monitoring**: Health checks and performance monitoring
- 🛡️ **Security**: Rate limiting, CORS, helmet, and input validation

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Payment**: Paystack
- **SMS**: mNotify, Arkesel
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Logging**: Morgan + custom logger

## Quick Start

### Prerequisites

- Node.js 16+ installed
- MongoDB database
- Paystack account
- SMS provider account (mNotify/Arkesel)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/datahustle/server.git
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your actual values
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Environment Variables

Create a `config.js` file based on `config.example.js`:

```javascript
module.exports = {
  server: {
    port: 5000,
    environment: 'development'
  },
  database: {
    uri: 'mongodb://localhost:27017/datahustle'
  },
  jwt: {
    secret: 'your-jwt-secret'
  },
  paystack: {
    secretKey: 'sk_test_your_paystack_secret_key'
  },
  // ... other configurations
};
```

## API Endpoints

### Authentication
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login
- `GET /api/v1/me` - Get user profile

### Data Purchases
- `POST /api/v1/data/purchase-data` - Purchase data bundle
- `GET /api/v1/data/purchase-history/:userId` - Get purchase history
- `GET /api/v1/data/order-status/:orderId` - Check order status

### Payments
- `POST /api/v1/deposit` - Initiate deposit
- `GET /api/v1/verify-payment` - Verify payment
- `GET /api/v1/user-transactions/:userId` - Get transactions

### SMS Services
- `POST /api/sms/send-bulk` - Send bulk SMS
- `GET /api/sms/history` - Get SMS history

### Phone Verification
- `GET /api/verifications/services` - Get available services
- `POST /api/verifications/create` - Create verification
- `GET /api/verifications/history` - Get verification history

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/approve-user/:userId` - Approve user
- `GET /api/orders/admin-orders` - Get all orders

### Developer API
- `POST /api/developer/generate-key` - Generate API key
- `POST /api/developer/purchase` - Purchase via API

## Project Structure

```
server/
├── index.js                 # Main server file
├── package.json            # Dependencies and scripts
├── config.example.js       # Configuration template
├── API_DOCUMENTATION.md    # API documentation
├── README.md              # This file
├── middleware/            # Custom middleware
│   ├── validation.js      # Input validation
│   └── ...
├── routes/               # Route handlers
│   ├── auth.js          # Authentication routes
│   ├── orders.js        # Order management
│   ├── payments.js      # Payment processing
│   └── ...
├── models/              # Database models
│   ├── User.js         # User model
│   ├── Order.js        # Order model
│   └── ...
├── utils/               # Utility functions
│   ├── logger.js       # Logging utility
│   └── ...
├── config/              # Configuration files
└── logs/               # Log files
```

## Database Models

### User
- Basic user information
- Wallet balance
- Referral system
- Device tracking
- Admin approval status

### DataPurchase
- Order details
- Network and capacity
- Pricing information
- Status tracking
- API responses

### Transaction
- Payment records
- Wallet transactions
- Refund tracking
- Fraud detection

### SMSHistory
- SMS campaign tracking
- Delivery status
- Cost tracking

## Security Features

- **Rate Limiting**: Prevents abuse and DDoS attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Fraud Detection**: Payment amount validation
- **Device Tracking**: Block suspicious devices

## Monitoring & Logging

- **Health Checks**: `/health` endpoint for monitoring
- **Request Logging**: All API requests logged
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **Database Operations**: Query logging
- **Payment Tracking**: Transaction monitoring

## Deployment

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-mongo-uri
JWT_SECRET=your-super-secure-jwt-secret
PAYSTACK_SECRET_KEY=sk_live_your_paystack_key
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Support

- **Email**: support@datahustle.shop
- **Documentation**: https://docs.datahustle.shop
- **Issues**: GitHub Issues

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0
- Initial release
- Core functionality implemented
- Payment integration
- SMS services
- Admin panel
- Developer API

---

Built with ❤️ by the DataHustle team
