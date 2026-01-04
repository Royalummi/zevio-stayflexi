# 🏡 Zevio - Villa Booking Platform

**Modern luxury villa booking system with Next.js + React + Node.js**

**Status:** 🚀 In Active Development  
**Current Phase:** Next.js Public Pages Migration  
**Last Updated:** January 4, 2026

---

## 📊 Project Status

| Component           | Status         | Progress | Port |
| ------------------- | -------------- | -------- | ---- |
| **Backend API**     | ✅ Complete    | 100%     | 5000 |
| **React Dashboard** | ✅ Complete    | 95%      | 3000 |
| **Next.js Pages**   | 🚧 In Progress | 25%      | 8000 |
| **Database**        | ✅ Complete    | 100%     | 3306 |

---

## 🚀 Quick Start

### Prerequisites

- Node.js v22+
- MySQL 8.x
- npm/yarn

### Start All Servers

```bash
# Terminal 1: Backend (Port 5000)
cd backend
npm start

# Terminal 2: React Dashboard (Port 3000)
cd frontend
npm run dev

# Terminal 3: Next.js Public Site (Port 8000)
cd nextjs
npm run dev
```

**Access:**

- Next.js: http://localhost:8000 (Public pages)
- React: http://localhost:3000 (Dashboard)
- Backend: http://localhost:5000 (API)

---

## 📚 Documentation

**Essential Docs (Read in order):**

1. **NEXTJS_DEVELOPMENT_LOG.md** - Latest session updates
2. **NEXTJS_MIGRATION_TRACKER.md** - Current tasks & progress
3. **DEVELOPMENT_TRACKER.md** - Overall project status
4. **AI_DEVELOPMENT_MASTER_TRACKER.md** - Architecture & AI guide
5. **Zevio_Villa_MVP_Full_Development_Guide.md** - System architecture

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         CURRENT SYSTEM                       │
└─────────────────────────────────────────────┘

1. NEXT.JS (Public) - Port 8000 🚧
   ├── Homepage ✅
   ├── Properties List (Building...)
   └── Property Detail (Pending)

2. REACT (Dashboard) - Port 3000 ✅
   ├── User Dashboard
   ├── Admin Dashboard
   ├── Bookings
   └── Payments

3. BACKEND (API) - Port 5000 ✅
   └── 30+ REST endpoints

4. DATABASE - Port 3306 ✅
   └── MySQL (25 tables)
```

---

## 💻 Tech Stack

**Frontend:**

- Next.js 16 (Public pages - Trivago-style)
- React 19 (Dashboard - Shadcn UI)
- TypeScript
- Tailwind CSS

**Backend:**

- Node.js v22
- Express.js
- MySQL 8
- JWT Authentication

**Tools:**

- Razorpay (Payments)
- Nodemailer (Emails)
- Axios (API)

---

## 👨‍💻 Development

**Active Work:** Building Next.js public pages

**Completed:**

- ✅ Homepage with Trivago-style search
- ✅ Advanced search bar
- ✅ Header & Footer
- ✅ Responsive design

**Next:**

- 🚧 Properties listing page
- 🚧 Property detail page
- 🚧 Integration with React dashboard

---

## 📝 Notes

- **Port 8000:** Next.js (new public site)
- **Port 3000:** React (existing dashboard - don't touch)
- **Port 5000:** Backend API (don't modify)

**For AI Agents:**
Start with NEXTJS_DEVELOPMENT_LOG.md for context, then check NEXTJS_MIGRATION_TRACKER.md for tasks.

---

**Senior Full-Stack Developer**  
Building industry-standard, Trivago-inspired UI/UX  
January 2, 2026
