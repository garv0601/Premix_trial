# 🌾 Annapurna Premix — E-Commerce Web Application

> **Status:** 🔒 Private Repository — Active Development  
> **Last Updated:** September 2026

A full-stack e-commerce web application for **Annapurna Premix**, an Indian food premix brand. Built with React + Vite on the frontend, Node.js + Express on the backend, Supabase as the database & auth layer, and a separate React admin dashboard.

---

## 📁 Project Structure

```
Annapurna-Premix/
│
├── frontend/               # Customer-facing React + Vite app
├── backend/                # Node.js + Express REST API
├── admin/                  # Admin dashboard (React + Vite)
│   ├── frontend/           # Admin React app
│   ├── backend/            # Admin-specific backend routes (shared with main)
│   └── DATABASE_SCHEMA.md  # Single source of truth for DB schema
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Framer Motion, Lucide React |
| **Admin Panel** | React 18, Vite |
| **Backend** | Node.js, Express 4, ES Modules |
| **Database & Auth** | Supabase (PostgreSQL + RLS + Auth) |
| **Payments** | Cashfree Payment Gateway |
| **Styling** | Vanilla CSS (dark theme, glassmorphism) |

---

## 🌐 Customer Frontend (`/frontend`)

### Pages

| Route | Description |
|---|---|
| `/` | Home — Hero, Featured Products, How It Works, Reviews preview, Story teaser |
| `/shop` | Full product catalogue with filtering & search |
| `/product/:slug` | Product detail page |
| `/cart` | Cart page |
| `/checkout` | Checkout with address & payment |
| `/order-success` | Post-payment confirmation |
| `/orders` | My Orders list |
| `/orders/:id` | Order detail view |
| `/account` | Account overview |
| `/account/edit` | Edit profile |
| `/account/addresses` | Saved addresses (add/edit/delete) |
| `/account/payment-methods` | Saved payment methods |
| `/login` | Login page |
| `/signup` | Sign-up page |
| `/story` | Our Story page |
| `/contact` | Contact Us page |

### Key Components

- **Layout** — Header, Footer, WhatsApp floating button
- **Home** — Hero, FeaturedProducts, HowItWorks, PremixExplanation, ReviewsPreview, ShopCTA, StoryPreview, WhyAnnapurna
- **Product** — ProductCard, ProductGrid, ProductFilter, ProductDetailModal
- **Cart** — CartDrawer (slide-out), CartPage
- **Checkout** — CheckoutPage with Cashfree Payment Gateway integration, OrderSuccessPage
- **Orders** — OrderCard, OrderItem, OrderStatusBadge, OrderSummary
- **Reviews** — ReviewCard, ReviewForm, ReviewList
- **Account** — ProfileCard, AccountSidebar, RecentOrders, QuickActions, MaasTip, AssistanceCard
- **Addresses** — AddressCard, AddressForm, DeleteAddressDialog
- **Auth** — AuthLayout, ProtectedRoute
- **Common** — Button, Badge, Modal, RatingStars, CartDrawer

### Hooks

| Hook | Purpose |
|---|---|
| `useAuth` | Supabase session management |
| `useCart` | Cart state (add, remove, quantity, subtotal) |
| `useProducts` | Fetch & cache products from Supabase |
| `useActiveProducts` | Filtered active-only products |
| `useReviews` | Fetch and submit reviews |

---

## ⚙️ Backend API (`/backend`)

Node.js + Express REST API using ES Modules (`"type": "module"`).

### Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Single product |
| `POST` | `/api/orders` | Create order (authenticated, server-side) |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/reviews` | Submit a review |
| `GET` | `/api/reviews` | List reviews |
| `POST` | `/api/contact` | Submit contact message |

### Architecture

```
backend/src/
├── config/
│   ├── config.js       # Environment config
│   ├── supabase.js     # Supabase admin client (service-role, server-side only)
│   └── cashfree.js      # Cashfree Payment Gateway client
├── controllers/        # Request handlers (product, order, review, contact)
├── routes/             # Express route definitions
├── models/             # Data layer (Supabase queries)
├── services/           # Business logic (order creation, store, inventory)
├── middleware/         # Logger, error handler
├── utils/              # Seed data helpers
└── server.js           # App entry point (port 5000)
```

### Security

- **Service-role key** is used **only on the backend**. The frontend uses the public `anon` key.
- User JWTs are verified server-side via `verifyUser(jwt)` before any privileged operation.
- Supabase RLS policies protect all data at the database level.

---

## 🛡️ Admin Panel (`/admin`)

A separate React + Vite application for internal business operations.

### Admin Pages

| Page | Description |
|---|---|
| **Dashboard** | KPIs, revenue charts, recent activity |
| **Product Management** | Add, edit, toggle visibility (active/inactive), stock updates |
| **Orders** | View & update order statuses |
| **Customers** | Customer list & profile lookup |
| **Reviews** | Approve or reject submitted reviews |
| **Coupons** | Create & manage discount coupons |
| **Login** | Admin-only auth (separate from customer auth) |

### Admin Services

```
admin/frontend/src/services/
├── adminAuthService.js
├── productService.js
├── orderService.js
├── customerService.js
├── reviewService.js
├── couponService.js
└── dashboardService.js
```

---

## 🗄️ Database (Supabase)

> Full schema documented in [`admin/DATABASE_SCHEMA.md`](./admin/DATABASE_SCHEMA.md).

### Tables

| Table | Description |
|---|---|
| `Profiles` | Customer profiles linked to `auth.users` |
| `addresses` | Saved delivery addresses |
| `products` | Product catalogue with stock & visibility |
| `categories` | Product categories |
| `orders` | Customer orders |
| `order_items` | Line items (purchase-time price snapshot) |
| `payments` | Cashfree payment records |
| `reviews` | Customer reviews (requires approval) |
| `coupons` | Discount codes |
| `coupon_usage` | Per-order coupon tracking |
| `notifications` | Customer order notifications |
| `contact_messages` | Contact form submissions |
| `admin_users` | Admin authorization table |
| `admin_activity_logs` | Admin action audit trail |

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cashfree](https://www.cashfree.com) merchant account (for payments, TEST/SANDBOX mode)

---

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CASHFREE_APP_ID=your-cashfree-app-id
CASHFREE_SECRET_KEY=your-cashfree-secret-key
CASHFREE_ENV=SANDBOX
PORT=5000
```

```bash
npm run dev     # development (auto-restart)
npm start       # production
```

> API runs on `http://localhost:5000`

---

### 2. Customer Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

> Frontend runs on `http://localhost:5173`

---

### 3. Admin Panel

```bash
cd admin/frontend
npm install
npm run dev
```

> Admin runs on `http://localhost:5174` (or next available port)

---

## 🔑 Supabase Auth Setup

In your Supabase dashboard → **Authentication → Providers**, enable:

- ✅ Email (email/password)
- ✅ Google OAuth
- ✅ Facebook OAuth (optional)

### Key Reference

| Variable | Location | Safe to expose? |
|---|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon/public | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role | ❌ **Never expose** |

> ⚠️ The `service_role` key is **server-side only**. Never put it in any frontend `.env`.

---

## 🚧 Current Status

| Area | Status |
|---|---|
| Customer Frontend (UI) | ✅ Complete |
| Supabase Auth (Login / Signup) | ✅ Complete |
| Product Catalogue & Filtering | ✅ Complete |
| Cart & CartDrawer | ✅ Complete |
| Checkout Page | ✅ Complete |
| Razorpay Payment Integration | ❌ Removed |
| Cashfree Payment Integration | ✅ Complete (TEST/SANDBOX) |
| Order Creation (server-side) | ✅ Complete |
| Inventory Management (atomic RPC) | ✅ Complete |
| Order History (My Orders) | ✅ Complete |
| Account & Profile Management | ✅ Complete |
| Saved Addresses | ✅ Complete |
| Reviews System | ✅ Complete |
| Contact Page & Backend Endpoint | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Admin Product Management | ✅ Complete |
| Admin Order Management | ✅ Complete |
| Admin Customer Management | ✅ Complete |
| Admin Reviews Moderation | ✅ Complete |
| Admin Coupons Management | ✅ Complete |
| Deployment | 🔜 Pending |

---

## 📌 Notes

- `orders.shipping_address` (with trailing 's') is the **exact column name** in the database (verified live). It stores a JSONB snapshot of the address used at checkout.
- `order_items.product_name` and `order_items.product_price` are **purchase-time snapshots** — never overwrite with current product data.
- Admin auth is separate from customer auth. Admin users must have a record in `admin_users` with `is_active = true`.
- All admin write operations are protected by RLS using the `is_admin()` database function.

---

*This is a private repository. Do not share credentials or keys.*
