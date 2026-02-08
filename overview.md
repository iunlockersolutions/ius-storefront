# E-Commerce Platform — Project Overview

## 1. Project Summary
This project is a **production-grade e-commerce platform** for electronic products (mobile phones, accessories, etc.) built using a **monolithic Next.js architecture**.  

The platform includes:
- A **public storefront** optimized for SEO and performance
- A **secure admin dashboard** for internal operations
- Strong **data integrity** for orders, inventory, and payments
- A design that is **simple to operate today** and **easy to scale or split later**

The system prioritizes:
- Correctness over shortcuts
- Server-side enforcement of rules
- Clean domain boundaries
- Long-term maintainability

---

## 2. Technology Stack

### Frontend
- **Next.js (App Router)**  
  Used as a full-stack framework for SSR, ISR, and server components.
- **TypeScript**  
  Ensures type safety across frontend and backend logic.
- **Shadcn UI + Tailwind CSS**  
  Provides a clean, accessible, and fast-to-build design system.
- **React Hook Form + Zod**  
  Handles form state and validation with shared schemas.
- **TanStack Query**  
  Manages client-side server state, caching, and revalidation.
- **TanStack Table**  
  Powers data-heavy admin tables.

### Backend
- **Next.js Server Actions & Route Handlers**  
  Used instead of a separate backend service.
- **Drizzle ORM**  
  Type-safe database access and schema definition.
- **PostgreSQL (Vercel Postgres)**  
  Primary data store for all domains.
- **BetterAuth**  
  Handles authentication, sessions, SSO, and passkeys.

### Infrastructure
- **Vercel**  
  Hosting, edge network, and CI/CD.
- **Vercel Postgres**  
  Managed PostgreSQL database.
- **Vercel Blob**  
  Image and file storage.

---

## 3. User Roles & Permissions

### Customer
- Browse products
- Search and filter catalog
- Manage cart and favorites
- Place orders
- Pay via card or bank transfer
- Track order status
- Leave product reviews
- Manage profile and addresses

### Admin (Full Access)
- Manage products, categories, and variants
- Manage inventory and stock adjustments
- View and update all orders
- Manually create in-store purchases (invoicing)
- Manage customers (suspend/activate)
- Manage staff users
- View analytics and reports

### Manager (Operations)
- Product and inventory management
- Order status updates
- Customer support actions
- Limited analytics access

### Support / Moderator
- View and assist with orders
- Moderate product reviews
- View customer information (read-only or limited write)

All permissions are enforced **server-side using RBAC**.  
Client-side role checks are treated as UI hints only.

---

## 4. Application Architecture

### Monolith Design
The system is implemented as a **single Next.js application** with clear internal boundaries.

```
Next.js App (Monolith)
├── Storefront (Public, SEO-heavy)
├── Admin Dashboard (Protected)
├── Server Actions (Business Logic)
├── Database Access (Drizzle)
└── Auth & RBAC (BetterAuth)
```

This approach:
- Reduces operational complexity
- Avoids premature microservices
- Enables faster iteration
- Keeps data consistency simple

The architecture is intentionally designed so the admin dashboard can later be extracted into a **separate application** without database changes.

---

## 5. Domain-Driven Structure

### Core Domains
- **Auth & Accounts** – users, sessions, roles
- **Catalog** – products, variants, categories, attributes
- **Inventory** – stock levels and movement ledger
- **Cart** – guest and authenticated carts
- **Orders** – order lifecycle and history
- **Payments** – card payments and bank transfers
- **Reviews** – customer feedback with moderation
- **Admin** – analytics, auditing, and management

Each domain:
- Owns its data models
- Exposes controlled server actions
- Enforces validation and permissions

---

## 6. Order & Inventory Integrity

### Order Lifecycle
Orders follow a strict state machine:
- DRAFT
- PENDING_PAYMENT
- PAID
- PACKING
- SHIPPED
- DELIVERED
- CANCELLED / REFUNDED

All transitions are validated on the server.

### Inventory Model
Inventory is handled using a **ledger-based system**:
- Stock is never trusted from the client
- Every change creates an inventory movement record
- Supports manual adjustments, sales, and in-store purchases

This ensures traceability and prevents stock corruption.

---

## 7. Security Model

- Authentication handled centrally via BetterAuth
- RBAC enforced in every server mutation
- Admin routes protected by middleware
- Sensitive operations wrapped in database transactions
- CSRF protection and rate limiting applied to critical routes
- No direct database access from the client

---

## 8. Performance & SEO Strategy

### Storefront
- Server Components by default
- SSR / ISR for product and category pages
- Minimal client-side JavaScript
- Structured data (JSON-LD) for products
- Sitemap and metadata generation

### Admin
- Client-heavy UI optimized for productivity
- TanStack Query for caching and background refetching
- No SEO requirements

---

## 9. Scalability & Future Evolution

This architecture supports:
- Splitting storefront and admin into separate apps
- Adding background jobs (emails, reports)
- Introducing external search engines
- Scaling the database with replicas
- Adding multi-warehouse inventory

Without rewriting core business logic.

---

## 10. Design Philosophy

- Start simple, but correct
- Prefer explicitness over magic
- Enforce rules on the server
- Design today for tomorrow’s scale
- Optimize for developer clarity

---

NOTE: remember that when you create big forms, use step form design

llm txt files:
- https://www.better-auth.com/llms.txt
- https://orm.drizzle.team/llms-full.txt
- https://ui.shadcn.com/llms.txt
- https://nextjs.org/docs/llms-full.txt
- https://resend.com/docs/llms-full.txt

## Conclusion
This project delivers a **robust, modern e-commerce platform** that balances speed of development with production-grade reliability.  
It is intentionally designed as a clean monolith that can evolve gracefully as requirements and scale increase.
