# RockeryXPrints — Full-Stack E-Commerce Platform

<div align="center">

![RockeryXPrints](https://img.shields.io/badge/Live-rockeryprints.in-black?style=for-the-badge&logo=vercel)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=white)

**A production-grade, full-stack e-commerce platform built for a real print-on-demand business.**

[🌐 Live Site](https://rockeryprints.in) · [📦 Backend](./backend) · [🎨 Frontend](./frontend)

</div>

---

## Overview

RockeryXPrints is the official full-stack e-commerce web application powering [Rockery Prints](https://rockeryprints.in), an on-demand print & apparel platform. The system handles the complete shopping lifecycle — multi-category product discovery, persistent cart synchronization, secure online payments via **Razorpay**, COD order handling, and an administrative control panel for catalogue and order fulfilment.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite 8 | UI framework with fast HMR dev server |
| Redux Toolkit | Global auth & cart state management |
| React Router v7 | Client-side routing with lazy-loaded pages |
| Framer Motion | Page transitions and micro-animations |
| Tailwind CSS v4 | Utility-first styling |
| Three.js + React Three Fiber | 3D landing page elements |
| Axios | HTTP client with interceptors |
| react-helmet-async | Per-page SEO meta tags |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database + ODM |
| Razorpay SDK | Payment gateway integration |
| Cloudinary + Multer | Image upload and CDN delivery |
| bcrypt + JWT | Auth — password hashing & access/refresh tokens |
| Zod | Runtime schema validation |
| Helmet | HTTP security headers |
| express-rate-limit | Per-IP API rate limiting |
| express-mongo-sanitize | NoSQL injection prevention |
| morgan | HTTP request logging |

### Deployment
| Service | Role |
|---|---|
| Vercel | Frontend hosting (global CDN) |
| Render | Backend hosting |
| MongoDB Atlas | Managed database |
| Cloudinary | Image storage & CDN |

---

## Architecture

```
rockeryprints.in  (Vercel)
      │
      │  HTTPS REST
      ▼
 Express 5 API  (Render)
      │
      ├── /api/v1/users    — Auth, profile, cart, wishlist, addresses
      ├── /api/v1/prods    — Products, categories, collections, reviews
      └── /api/v1/orders   — Razorpay two-step flow, COD, order tracking
      │
      ├── MongoDB Atlas     — Primary data store
      └── Cloudinary        — Product image CDN
```

**Frontend architecture:**
- All pages are **lazy-loaded** with `React.lazy` + `Suspense` to minimize initial bundle size
- Redux Toolkit slices (`authSlice`, `cartSlice`) manage global state; cart is server-synced on login
- `ErrorBoundary` at root catches unhandled render errors gracefully
- SEO meta tags are injected per-route via `react-helmet-async`

---

## Key Features

### Shopping Experience
- 🛍️ **Product Catalogue** — Shop by category, collection, or via a unified shop page with filters
- 🔍 **Product Detail Pages** — Image gallery, size/variant selection, reviews, related products
- 🛒 **Persistent Cart** — Server-synced cart that persists across sessions for logged-in users
- ❤️ **Wishlist** — Save products for later
- 📦 **Order Tracking** — Full order history and per-order status page

### Checkout & Payments
- 💳 **Razorpay Integration** — Two-step online payment: `initiate` (creates Razorpay order) → `verify` (HMAC signature validation before order is persisted)
- 🚚 **Cash on Delivery** — COD order flow as an alternative checkout path
- 📬 **Saved Addresses** — Multiple shipping addresses per user account

### Admin Dashboard
- 📊 **Order Management** — View all orders, update status (`Processing → Shipped → Out for Delivery → Delivered`)
- 🖼️ **Product Management** — Create, edit, and delete products with Cloudinary image upload
- 🗂️ **Category & Collection Management** — Organise the catalogue

### Security
- 🔐 **JWT Auth** — Short-lived access tokens + rotating refresh token array (stored in httpOnly cookies)
- 🛡️ **OTP Email Verification** — OTP-based flow for email verification and password reset
- 🧹 **Input Sanitization** — `express-mongo-sanitize` (NoSQL injection) + custom XSS middleware on all user inputs
- 📏 **Rate Limiting** — 200 req / 15 min per IP across all `/api/` routes
- 🪖 **Security Headers** — `helmet` sets CSP, HSTS, X-Frame-Options, and more
- ✅ **Zod Validation** — All request bodies validated against typed schemas before reaching controllers

---

## API Reference

### Auth / Users — `/api/v1/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Register + send OTP |
| `POST` | `/verify-email` | — | Verify OTP |
| `POST` | `/login` | — | Login, returns tokens |
| `POST` | `/logout` | ✅ | Logout, clears refresh token |
| `POST` | `/refresh-token` | — | Rotate access token |
| `GET` | `/me` | ✅ | Get current user |
| `PATCH` | `/update-profile` | ✅ | Update name / avatar |
| `POST` | `/forgot-password` | — | Send password reset OTP |
| `POST` | `/reset-password` | — | Set new password |
| `GET/POST/DELETE` | `/cart` | ✅ | Cart CRUD |
| `GET/POST/DELETE` | `/wishlist` | ✅ | Wishlist CRUD |
| `GET/POST/DELETE` | `/addresses` | ✅ | Address book |

### Products — `/api/v1/prods`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List products (paginated, filterable) |
| `GET` | `/:slug` | — | Product detail |
| `POST` | `/` | 🔑 Admin | Create product |
| `PATCH` | `/:id` | 🔑 Admin | Update product |
| `DELETE` | `/:id` | 🔑 Admin | Delete product |
| `POST/DELETE` | `/:id/reviews` | ✅ | Add / remove review |
| `GET` | `/categories` | — | List categories |
| `GET` | `/collections` | — | List collections |

### Orders — `/api/v1/orders`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/initiate` | ✅ | Create Razorpay order |
| `POST` | `/verify` | ✅ | Verify HMAC & persist order |
| `POST` | `/create` | ✅ | Place COD order |
| `GET` | `/get-orders` | ✅ | User order history |
| `GET` | `/get-all-orders` | 🔑 Admin | All orders |
| `PATCH` | `/update-status/:orderId` | 🔑 Admin | Update order status |
| `GET` | `/:orderId` | Optional | Order detail |

---

## Data Models

```
User          — email, fullName, role, cart[], wishlist[], addresses[], refreshTokens[], OTP fields
Product       — name, slug, images[], price, MRP, category, collection, stock, reviews[]
Order         — user, orderItems[], pricing, shippingAddress, Razorpay IDs, paymentStatus, orderStatus
Category      — name, slug, image
Collection    — name, slug, image
Review        — user, product, rating, comment
```

---

## Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas URI)
- Cloudinary account
- Razorpay account (test keys are fine)

### 1. Clone the repo
```bash
git clone https://github.com/ShankShip/RockeryXPrints.git
cd RockeryXPrints
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # Fill in your environment variables
npm install
npm run dev            # Starts on http://localhost:3000
```

**Required `.env` keys** (see `.env.example`):
```
PORT
MONGODB_URI
ACCESS_TOKEN_SECRET / ACCESS_TOKEN_EXPIRY
REFRESH_TOKEN_SECRET / REFRESH_TOKEN_EXPIRY
CORS_ORIGIN
CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
NODE_ENV
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env   # Set VITE_API_BASE_URL
npm install
npm run dev            # Starts on http://localhost:5173
```

---

## Project Structure

```
RockeryXPrints/
├── backend/
│   └── src/
│       ├── controllers/    # order, product, user
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routers
│       ├── middleware/     # JWT, admin, XSS, error, validate, multer
│       ├── validators/     # Zod schemas
│       ├── utils/          # ApiError, ApiResponse, asyncHandler
│       └── db/             # MongoDB connection
└── frontend/
    └── src/
        ├── pages/          # 13 route-level pages (all lazy-loaded)
        ├── components/     # Reusable UI components
        ├── store/          # Redux Toolkit slices (auth, cart)
        ├── services/       # Axios API calls
        └── utils/          # Shared helpers
```

---

## Authors & Attribution

- **Lead Engineer & System Architect:** [Akshat Nagar](https://github.com/Howdie-da)

---

## License

© 2025 [Rockery Prints](https://rockeryprints.in). All rights reserved. Codebase is open for architectural reference and portfolio review.
