# ShopNest E-Commerce Frontend (`ecommerce-web`)

Production-ready, responsive e-commerce web application built strictly according to the `ecommerce-frontend-prd.md` specification. It integrates seamlessly with the `ecommerce-api` Go backend.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **State Management & Server Cache**: TanStack React Query v5
- **Form Handling & Validation**: React Hook Form + Zod
- **HTTP Client**: Axios with interceptors (JWT auth injection & silent refresh token rotation)
- **Icons**: Lucide React

---

## 🚀 Key Features

### 1. Storefront (Public)
- **Home (`/`)**: Hero banner, value propositions, category showcase, featured products, newsletter signup.
- **Product Catalog (`/products`)**: Real-time keyword search, category filter, in-stock toggle, sorting (price, newest, name), pagination.
- **Product Details (`/products/[id]`)**: High-res image display, stock availability badges, quantity selector, category breadcrumbs, add-to-cart integration.
- **Categories (`/categories`)**: Grid of active categories with direct links to pre-filtered product catalogs.
- **Authentication (`/login`, `/register`)**: JWT login and customer registration with form validation and redirect support.

### 2. Customer Features (Protected)
- **Cart Management (`/cart`)**: Persistent cart syncing with Go backend, quantity increment/decrement, remove item, subtotal calculation, empty states.
- **Checkout (`/checkout`)**: Multi-field address validation via Zod, automatic unique `Idempotency-Key` generation per checkout attempt to prevent duplicate charges, live cart item summary.
- **Order History (`/orders`)**: Paginated list of customer orders with status filters (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled).
- **Order Details (`/orders/[id]`)**: Full order breakdown, shipping address, line items, status history timeline, and the ability to cancel pending orders.
- **Profile & Security (`/profile`)**: Update name and phone number, change account password with validation.

### 3. Admin Control Panel (`/admin`)
- **Dashboard (`/admin`)**: Summary metrics (Total Revenue, Orders, Products, Low Stock count), 7-day revenue trend chart, recent orders table.
- **Product Management (`/admin/products`)**: Create, edit, and archive products with SKU, category mapping, stock, and minor-unit price conversion.
- **Category Management (`/admin/categories`)**: Create and update category catalog with active status switches.
- **Inventory Monitor (`/admin/inventory`)**: Stock level tracking, low-stock warnings, inline restock and manual adjustment modal (`RESTOCK`, `ADJUSTMENT`).
- **Order Management (`/admin/orders`)**: Comprehensive order inspection, filter by status, and strict state-machine transition modal (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`, or `CANCELLED`).
- **User Management (`/admin/users`)**: User directory with role indicators and one-click account activation / deactivation.

---

## 💰 Minor Units Money Handling

To ensure precision without floating-point inaccuracies, the Go backend stores all monetary values in integer minor units (e.g., `1200000` = `12,000.00 BDT`).
The frontend:
1. Formats all backend monetary figures using `formatPrice(amount, currency)` in `lib/utils.ts`.
2. Converts standard units to minor units before submitting create/update mutations to the API.

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the `ecommerce-web` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 🏃 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v24)
- Running `ecommerce-api` Go backend on port 8080

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

### 5. Lint & Type Check
```bash
npm run lint
```

---

## 📁 Directory Structure

```
ecommerce-web/
├── app/                      # Next.js App Router pages
│   ├── (public)/             # Storefront routes
│   │   ├── page.tsx          # Home page
│   │   ├── products/         # Catalog & Product detail
│   │   ├── categories/       # Category directory
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── (customer)/           # Authenticated customer routes
│   │   ├── cart/             # Shopping cart
│   │   ├── checkout/         # Order checkout
│   │   ├── orders/           # Order list & order details
│   │   └── profile/          # User profile & security
│   ├── admin/                # Admin backoffice routes
│   │   ├── page.tsx          # Analytics dashboard
│   │   ├── products/         # Product catalog management
│   │   ├── categories/       # Category management
│   │   ├── inventory/        # Stock adjustments & monitoring
│   │   ├── orders/           # Order workflow & status updates
│   │   └── users/            # Customer & admin account control
│   ├── layout.tsx            # Root layout with Query/Auth/Cart providers
│   └── globals.css           # Global Tailwind CSS styling
├── components/
│   ├── ui/                   # Button, Input, Select, Modal, Badge, Alert, Skeleton, Pagination
│   ├── layout/               # Navbar, Footer, AdminSidebar, AppShell, Providers
│   ├── product/              # ProductCard, ProductGrid, ProductFilters
│   ├── cart/                 # CartItemRow, CartSummary
│   ├── checkout/             # CheckoutForm
│   ├── order/                # OrderCard, OrderStatusBadge
│   └── admin/                # AdminStatsCard, StatusChangeModal
├── context/                  # AuthContext, CartContext
├── hooks/                    # useAuth, useCart
├── lib/                      # utils.ts, constants.ts
├── services/                 # Axios client, auth, products, orders, cart, admin, users
└── types/                    # TypeScript interfaces matching backend DTOs
```
