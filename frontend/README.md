# Zevio Admin & Vendor Management Panel

This is the **administrative and vendor management interface** for the Zevio platform.

## Purpose

This React application serves as the **backend management panel** for:

- **Admins** - Full platform management
- **Vendors** - Property management

⚠️ **Note:** User dashboards (bookings, profile) are in the Next.js app for seamless customer experience.

## Architecture

### Customer-Facing Website

👉 **Next.js** (`/nextjs` folder)

- Property browsing & search
- Service apartments
- Booking flow
- **User dashboard** (bookings, profile, payments)
- Public pages

### Management Panel (This App)

👉 **React** (`/frontend` folder)

- Admin dashboard
- Vendor property management
- Platform analytics & reports

## Key Pages

### Admin Routes (`/admin`)

- `/admin` - Dashboard overview
- `/admin/properties` - Manage all properties
- `/admin/users` - User management
- `/admin/bookings` - All bookings
- `/admin/refunds` - Process refunds
- `/admin/settlements` - Vendor settlements
- `/admin/reports` - Analytics & reports

### Vendor Routes (`/vendor`)

- `/vendor/dashboard` - Vendor overview
- `/vendor/properties` - Manage own properties
- `/vendor/bookings` - Property bookings
- `/vendor/settlements` - Payment settlements
- `/vendor/analytics` - Property analytics
- `/vendor/profile` - Vendor profile

## Authentication

- Login: `/login` (for Admin & Vendor only)
- Register: `/register` (for Admin & Vendor only)
- Role-based access control (Admin, Vendor)

💡 **Users:** Login and manage bookings through the Next.js app at `localhost:3000`

## Development

```bash
npm install
npm run dev
```

Runs on: `http://localhost:5173`

## Important Notes

⚠️ **This is NOT the customer-facing website**

- Customers use the Next.js app (localhost:3000) for all interactions
- This panel is ONLY for admins and vendors to manage the platform

🔒 **Protected Routes**

- All routes require authentication
- Role-based access (Admin or Vendor only)
- Users cannot access this app - they use Next.js dashboard

## Tech Stack

- React 18
- React Router
- TailwindCSS
- Shadcn/ui components
- Zustand (state management)
- Axios (API calls)
