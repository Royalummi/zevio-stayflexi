# Zevio Backend API

Backend REST API for Zevio Villa Booking Platform built with Node.js, Express, and MySQL.

## 🚀 Features

- JWT-based authentication (Access + Refresh tokens)
- Multi-role support (User, Admin, Vendor, Employee)
- Razorpay payment integration
- Email notifications (Nodemailer)
- Automated cron jobs
- Rate limiting & security headers
- Input validation
- Error handling

## 📋 Prerequisites

- Node.js v22.14.0 or higher
- MySQL 8.x
- XAMPP (for local development)

## ⚙️ Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

   - Copy `.env` and update values
   - Set your database credentials
   - Add Razorpay API keys
   - Configure Gmail for emails

3. Start MySQL (XAMPP):

   - Start Apache and MySQL from XAMPP Control Panel
   - Ensure database `zevio` exists

4. Start server:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/login` - Login (multi-role)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Public APIs (No Auth Required)

- `GET /api/public/cities` - Get all cities
- `GET /api/public/properties` - Get properties (with filters)
- `GET /api/public/property/:id` - Get property details
- `GET /api/public/availability` - Check property availability

### Bookings (User)

- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel-request` - Request cancellation
- `POST /api/bookings/validate-coupon` - Validate coupon code

### Payments (User)

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Razorpay webhook

### Admin

- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/bookings` - All bookings (with filters)
- `GET /api/admin/bookings/stats` - Booking statistics
- `POST /api/admin/refund` - Process refund
- `GET /api/admin/settlements/vendor` - Vendor settlements
- `POST /api/admin/settlements/vendor/mark-paid` - Mark settlement paid
- `GET /api/admin/claims/employee` - Employee claims
- `POST /api/admin/claims/employee/process` - Process employee claim
- `GET /api/payments/history` - Payment history

## 🔒 Authentication

All protected routes require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## 🕒 Cron Jobs

- **Daily Booking Processor** (2 AM IST):

  - Mark completed bookings
  - Confirm employee points
  - Create vendor settlements

- **Daily Cleanup** (3 AM IST):
  - Cancel expired pending_payment bookings

## 📧 Email Templates

- Booking confirmation
- Cancellation notification
- Refund processed

## 🔐 Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 min)
- Input validation
- JWT token expiry
- Password hashing (bcrypt)
- CORS protection

## 📝 Environment Variables

See `.env` file for all configuration options.

## 🧪 Testing

Use Postman or any API client to test endpoints.

## 📄 License

ISC
