# DataHustle API Documentation

## Overview
The DataHustle API provides endpoints for data bundle purchases, user management, payment processing, and administrative functions.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://api.unlimiteddatagh.com`

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "status": "success|error",
  "message": "Response message",
  "data": { ... }
}
```

## Error Responses
```json
{
  "error": "Error type",
  "message": "Error description",
  "details": { ... }
}
```

## Endpoints

### Health Check
- **GET** `/health`
- **Description**: Check server health and status
- **Response**: Server status, uptime, and environment info

### Authentication

#### Register User
- **POST** `/api/v1/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "phoneNumber": "0241234567",
    "referredBy": "ABC123" // optional
  }
  ```

#### Login User
- **POST** `/api/v1/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123"
  }
  ```

#### Get User Profile
- **GET** `/api/v1/me`
- **Headers**: `Authorization: Bearer <token>`

### Data Purchases

#### Purchase Data Bundle
- **POST** `/api/v1/data/purchase-data`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "userId": "user_id",
    "phoneNumber": "0241234567",
    "network": "YELLO",
    "capacity": 1,
    "price": 4.50
  }
  ```

#### Get Purchase History
- **GET** `/api/v1/data/purchase-history/:userId`
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `startDate` (optional): Start date filter
  - `endDate` (optional): End date filter
  - `network` (optional): Network filter

#### Check Order Status
- **GET** `/api/v1/data/order-status/:orderId`

### Payments

#### Initiate Deposit
- **POST** `/api/v1/deposit`
- **Body**:
  ```json
  {
    "userId": "user_id",
    "amount": 100,
    "email": "john@example.com"
  }
  ```

#### Verify Payment
- **GET** `/api/v1/verify-payment?reference=<payment_reference>`

#### Get User Transactions
- **GET** `/api/v1/user-transactions/:userId`
- **Query Parameters**:
  - `page`, `limit`, `status`, `type`

### Password Reset

#### Request Password Reset
- **POST** `/api/v1/request-reset`
- **Body**:
  ```json
  {
    "email": "john@example.com"
  }
  ```

#### Verify OTP and Reset Password
- **POST** `/api/v1/reset-password`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "otp": "123456",
    "newPassword": "NewSecurePass123"
  }
  ```

### SMS Services

#### Send Bulk SMS
- **POST** `/api/sms/send-bulk`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "phoneNumbers": ["0241234567", "0247654321"],
    "message": "Your message here",
    "senderId": "DataHustle"
  }
  ```

#### Get SMS History
- **GET** `/api/sms/history`
- **Query Parameters**: `page`, `limit`, `userId`

### Phone Verification

#### Get Available Services
- **GET** `/api/verifications/services`

#### Create Verification
- **POST** `/api/verifications/create`
- **Body**:
  ```json
  {
    "userId": "user_id",
    "serviceName": "WhatsApp",
    "capability": "sms"
  }
  ```

#### Get Verification History
- **GET** `/api/verifications/history`
- **Query Parameters**: `page`, `limit`, `status`, `userId`

### Admin Endpoints

#### Get All Users
- **GET** `/api/admin/users`
- **Headers**: `Authorization: Bearer <admin_token>`

#### Approve User
- **POST** `/api/approve-user/:userId`
- **Headers**: `Authorization: Bearer <admin_token>`

#### Get All Orders
- **GET** `/api/orders/admin-orders`
- **Headers**: `Authorization: Bearer <admin_token>`

#### Get Reports
- **GET** `/api/reports/summary`
- **Headers**: `Authorization: Bearer <admin_token>`

### Developer API

#### Generate API Key
- **POST** `/api/developer/generate-key`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "My API Key"
  }
  ```

#### Purchase Data via API
- **POST** `/api/developer/purchase`
- **Headers**: `X-API-Key: <your_api_key>`
- **Body**:
  ```json
  {
    "phoneNumber": "0241234567",
    "network": "YELLO",
    "capacity": 1
  }
  ```

## Network Codes
- `YELLO`: MTN Ghana
- `TELECEL`: Telecel Ghana
- `at`: AirtelTigo Ghana
- `AT_PREMIUM`: AirtelTigo Premium
- `airteltigo`: AirtelTigo (legacy)

## Data Capacities
Available data bundle sizes: 1GB, 2GB, 3GB, 4GB, 5GB, 6GB, 8GB, 10GB, 12GB, 15GB, 20GB, 25GB, 30GB, 40GB, 50GB, 100GB

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- SMS: 10 requests per hour

## Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `INSUFFICIENT_BALANCE`: Not enough wallet balance
- `PAYMENT_FAILED`: Payment processing failed
- `SERVICE_UNAVAILABLE`: External service unavailable

## Webhooks
The API supports webhooks for payment notifications:
- **URL**: `/api/v1/paystack/webhook`
- **Method**: POST
- **Content-Type**: application/json

## SDKs and Libraries
- JavaScript/Node.js SDK available
- Python SDK available
- PHP SDK available

## Support
For API support, contact:
- Email: api-support@datahustle.shop
- Documentation: https://docs.datahustle.shop
- Status Page: https://status.datahustle.shop
