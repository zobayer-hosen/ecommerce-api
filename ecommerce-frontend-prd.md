# E-commerce Frontend — PRD

## 1. Project Overview

Build a separate frontend application for the E-commerce Backend API.

### Project Structure

```text
E-COMMERCE/
├── ecommerce-api/   # Go backend
└── ecommerce-web/   # Next.js frontend
```

The frontend communicates with the Go REST API through HTTP/JSON. It must never access PostgreSQL directly.

---

## 2. Technology Stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- TanStack Query
- JWT authentication
- Lucide React
- Responsive design

### Backend API

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 3. User Roles

### Guest

Can:

- View homepage
- Browse products
- Search products
- Filter products
- View product details
- View categories
- Login
- Register

### Customer

Can:

- Do everything a Guest can do
- Manage profile
- Manage cart
- Checkout
- View own orders
- View order details

### Admin

Can:

- Access admin dashboard
- Manage products
- Manage categories
- Manage inventory
- Manage orders
- Manage users
- View dashboard statistics

Frontend route protection is for user experience only. Final authorization must always be enforced by the backend.

---

## 4. Pages and Routes

### Public Pages

```text
/
├── Home
/products
├── Product listing
/products/[id]
├── Product details
/categories
├── Category listing
/login
├── Login
/register
└── Register
```

### Customer Pages

```text
/profile
├── User profile
/cart
├── Shopping cart
/checkout
├── Checkout
/orders
├── Order history
/orders/[id]
├── Order details
```

### Admin Pages

```text
/admin
├── Dashboard
/admin/products
├── Product management
/admin/categories
├── Category management
/admin/inventory
├── Inventory management
/admin/orders
├── Order management
/admin/users
└── User management
```

---

## 5. Homepage

The homepage should include:

- Navigation bar
- Logo
- Product search
- Category navigation
- Login/Register actions
- Cart icon
- Hero section
- Featured products
- Product categories
- Popular products
- Call-to-action sections
- Footer

The design should be clean, modern, responsive, and suitable for a normal e-commerce website.

---

## 6. Product Listing

Route:

```text
/products
```

Features:

- Product grid
- Product image
- Product name
- Product price
- Stock status
- Category
- Search
- Category filter
- Price filter if supported by API
- Pagination
- Loading state
- Empty state
- Error state

The frontend must use the backend API's supported query parameters.

---

## 7. Product Details

Route:

```text
/products/[id]
```

Show:

- Product image
- Product name
- Description
- Price
- Stock quantity/status
- Category
- Quantity selector
- Add to cart button

If the product is unavailable or out of stock, the UI must clearly communicate this and prevent invalid cart actions.

---

## 8. Authentication

### Login

Route:

```text
/login
```

Fields:

- Email
- Password

Requirements:

- React Hook Form
- Zod validation
- API integration
- Loading state
- Error handling
- Successful login handling
- JWT token management

### Register

Route:

```text
/register
```

Fields should follow the backend API contract.

Requirements:

- Client-side validation
- API integration
- Loading state
- Error handling
- Redirect after successful registration

---

## 9. Authentication and JWT

The frontend should:

1. Login through the backend API.
2. Receive access/refresh tokens according to the backend contract.
3. Store tokens using a secure and appropriate frontend strategy.
4. Attach the access token to authenticated API requests.
5. Handle expired access tokens using the refresh-token flow if supported by the backend.
6. Redirect unauthenticated users away from protected pages.
7. Clear authentication state on logout.

Do not hard-code JWT secrets in the frontend.

---

## 10. API Service Layer

Keep API communication separate from UI components.

Suggested structure:

```text
services/
├── auth.service.ts
├── user.service.ts
├── category.service.ts
├── product.service.ts
├── cart.service.ts
├── order.service.ts
├── admin.service.ts
└── dashboard.service.ts
```

Each service should contain API-related operations for its domain.

Example:

```text
product.service.ts
├── getProducts()
├── getProductById()
└── getProductsByCategory()
```

The exact methods must follow the backend API contract.

---

## 11. Customer Profile

Route:

```text
/profile
```

Features:

- View profile
- Edit profile
- Form validation
- Save changes
- Loading state
- Success message
- Error handling

---

## 12. Shopping Cart

Route:

```text
/cart
```

Features:

- List cart items
- Product image
- Product name
- Unit price
- Quantity
- Increase quantity
- Decrease quantity
- Remove item
- Subtotal
- Total
- Checkout button

The frontend must not assume stock availability. Backend stock rules are authoritative.

---

## 13. Checkout

Route:

```text
/checkout
```

Show:

- Cart summary
- Items
- Quantities
- Prices
- Total
- Checkout confirmation

The checkout request must be sent to the backend.

The backend is responsible for:

- Stock validation
- Transaction handling
- Order creation
- Inventory updates
- Order status

The frontend should display the backend response clearly.

---

## 14. Orders

### Order List

Route:

```text
/orders
```

Show:

- Order ID
- Date
- Total
- Status
- View details button

### Order Details

Route:

```text
/orders/[id]
```

Show:

- Order information
- Items
- Quantity
- Price
- Total
- Order status
- Order date

Users must only be able to access their own orders. Backend authorization remains authoritative.

---

## 15. Admin Dashboard

Route:

```text
/admin
```

Dashboard should display available backend statistics such as:

- Total users
- Total products
- Total orders
- Revenue
- Low-stock products
- Recent orders

Only admin users should be able to access the admin UI.

---

## 16. Admin Product Management

Route:

```text
/admin/products
```

Features:

- Product list
- Search
- Pagination
- Create product
- Edit product
- Delete product
- Product details
- Stock information

Use forms with React Hook Form and Zod.

---

## 17. Admin Category Management

Route:

```text
/admin/categories
```

Features:

- Category list
- Create category
- Edit category
- Delete category
- Loading states
- Empty states
- Error handling

---

## 18. Admin Inventory Management

Route:

```text
/admin/inventory
```

Features:

- View inventory
- View stock quantity
- Update stock
- Identify low-stock products
- Loading state
- Success/error feedback

Inventory business rules are controlled by the backend.

---

## 19. Admin Order Management

Route:

```text
/admin/orders
```

Features:

- View all orders
- Search/filter orders where supported
- View order details
- Update order status where supported

Order status must follow the backend state machine.

The frontend must not create invalid status transitions.

---

## 20. Admin User Management

Route:

```text
/admin/users
```

Features:

- User list
- User information
- Role information
- Pagination
- Search/filter where supported
- Admin actions supported by the backend

---

## 21. Suggested Folder Structure

```text
ecommerce-web/
├── app/
│   ├── page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── categories/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── products/
│       │   └── page.tsx
│       ├── categories/
│       │   └── page.tsx
│       ├── inventory/
│       │   └── page.tsx
│       ├── orders/
│       │   └── page.tsx
│       └── users/
│           └── page.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   ├── order/
│   └── admin/
│
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── category.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   ├── admin.service.ts
│   └── dashboard.service.ts
│
├── hooks/
├── lib/
├── types/
├── public/
├── .env.local
├── .env.example
└── README.md
```

---

## 22. State Management

Use TanStack Query for server state such as:

- Products
- Categories
- Cart
- Orders
- Users
- Admin dashboard data

Keep local UI state separate from server state.

Avoid unnecessary global state.

---

## 23. Form Handling

Use:

- React Hook Form
- Zod

for:

- Login
- Registration
- Profile
- Product creation
- Product editing
- Category creation/editing
- Inventory updates
- Other forms where validation is required

Validation should provide clear user-friendly messages.

---

## 24. UI States

Every API-driven page should handle:

### Loading

Display an appropriate loading indicator or skeleton.

### Empty

Example:

```text
No products found.
```

### Error

Display a clear error message and provide retry/recovery where appropriate.

### Success

Show confirmation after successful mutations.

---

## 25. Responsive Design

The frontend must work properly on:

- Mobile
- Tablet
- Laptop
- Desktop

Important areas:

- Navbar
- Product grid
- Product details
- Cart
- Checkout
- Tables
- Admin dashboard
- Forms
- Modals/dialogs

Admin tables should remain usable on small screens through responsive layouts or horizontal scrolling where necessary.

---

## 26. Error Handling

The frontend should understand the backend response/error envelope.

Handle:

- Validation errors
- Authentication errors
- Authorization errors
- Not found errors
- Conflict errors
- Server errors
- Network errors

Do not expose internal backend error details to normal users.

---

## 27. Security

Frontend security requirements:

- Never expose database credentials.
- Never expose JWT secret.
- Never connect directly to PostgreSQL.
- Do not trust frontend role checks for authorization.
- Do not trust frontend stock calculations.
- Do not trust frontend prices for checkout.
- Use HTTPS in production.
- Validate user input.
- Handle authentication state safely.

The backend remains the source of truth for security and business rules.

---

## 28. Environment Variables

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

Create:

```text
.env.example
```

Do not commit sensitive secrets.

---

## 29. API Integration Rules

The frontend must follow the backend API documentation exactly.

Backend base path:

```text
/api/v1
```

Do not invent API endpoints when an existing backend endpoint can be used.

Before implementing each frontend feature:

1. Check the backend endpoint.
2. Check request format.
3. Check response format.
4. Check authentication requirement.
5. Check role requirement.
6. Implement the frontend integration accordingly.

---

## 30. MVP Scope

### Included

- Authentication
- Registration
- Profile
- Product browsing
- Product search/filter
- Categories
- Cart
- Checkout
- Orders
- Admin dashboard
- Product management
- Category management
- Inventory management
- Order management
- User management
- Responsive UI

### Not Included

- Payment gateway
- Shipping integration
- Product reviews
- Coupons
- Wishlist
- Notifications
- Multi-vendor architecture
- Multi-currency
- Microservices
- Redis
- Kafka
- Kubernetes
- Message queues

Keep the implementation simple and aligned with the MVP.

---

## 31. Development Principles

Follow these principles:

- Clean and maintainable TypeScript
- Reusable components
- Avoid unnecessary duplication
- Separate UI and API logic
- Keep components focused
- Use proper TypeScript types
- Avoid `any` unless absolutely necessary
- Follow backend API contracts
- Do not duplicate backend business logic
- Build mobile-first responsive UI
- Keep dependencies reasonable
- Do not over-engineer

---

## 32. Definition of Done

The frontend is considered complete when:

- All required routes exist.
- Authentication works.
- JWT authentication works with the backend.
- Products can be browsed and searched.
- Categories work.
- Cart operations work.
- Checkout works.
- Customer orders work.
- Profile management works.
- Admin dashboard works.
- Admin product management works.
- Admin category management works.
- Admin inventory management works.
- Admin order management works.
- Admin user management works.
- Protected routes work.
- Loading/error/empty/success states are implemented.
- Responsive design works on mobile, tablet, and desktop.
- No direct database access exists in the frontend.
- No secrets are exposed in client-side code.
- Frontend API integration matches the Go backend contract.
- Production build completes successfully.
