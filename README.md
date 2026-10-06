# ShopNest E-Commerce Platform

A production-grade, full-stack E-Commerce system comprising a high-performance Go REST API backend (`ecommerce-api`) and a modern Next.js 14 frontend web application (`ecommerce-web`).

---

## 🏛 Architecture Overview

```
ecommerce-platform/
├── ecommerce-api/            # Go RESTful API backend
│   ├── cmd/api/              # Application entrypoint
│   ├── internal/             # Domain logic, handlers, middleware, services, repositories
│   ├── migrations/           # PostgreSQL SQL migrations
│   └── pkg/                  # Shared utilities (JWT, password hashing, validator, errors)
│
└── ecommerce-web/            # Next.js 14 App Router frontend
    ├── app/                  # Public storefront, customer portal, admin backoffice
    ├── components/           # Reusable UI, layout, product, cart, checkout components
    ├── services/             # Axios API integration matching Go backend endpoints
    └── types/                # Strongly-typed TypeScript interfaces matching API DTOs
```

---

## 🚀 Backend (`ecommerce-api`)

### Tech Stack
- **Language**: Go 1.22+
- **Router**: `go-chi/chi` v5
- **Database**: PostgreSQL with `jackc/pgx/v5`
- **Authentication**: JWT access & refresh tokens
- **Architecture**: Clean Architecture (Handler -> Service -> Repository)

### Running the Backend
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure database credentials in `.env`.
3. Apply database migrations:
   ```bash
   # Run the SQL migration scripts in migrations/
   ```
4. Build and start the server:
   ```bash
   go run cmd/api/main.go
   ```
The backend server runs on `http://localhost:8080` (API routes at `/api/v1`).

---

## 💻 Frontend (`ecommerce-web`)

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **HTTP**: Axios with automatic token refresh

### Running the Frontend
1. Navigate to `ecommerce-web`:
   ```bash
   cd ecommerce-web
   ```
2. Ensure `.env.local` contains:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```
3. Install dependencies and start development server:
   ```bash
   npm install
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm run start
   ```

---

## 🔑 Key Features

- **Storefront**: Browse products, search, category filters, product details, stock indicators.
- **Cart & Checkout**: Persistent cart synced with backend, multi-field shipping address form, unique idempotency keys on checkout.
- **Customer Portal**: Order history with status filters, detailed view with status history timeline, order cancellation for pending orders, profile and password management.
- **Admin Control Panel**: Real-time sales metrics, product CRUD with minor unit price handling, inventory restock and stock adjustment, order state-machine updates, user role and status controls.
- **Reliable Pricing**: All monetary amounts are stored in minor units (`BIGINT`) to prevent floating-point rounding issues and formatted nicely across the UI.