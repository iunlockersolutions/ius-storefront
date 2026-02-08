# 🛒 IUS Shop - E-Commerce Platform Implementation Tracker

> **Tech Stack:** Next.js 16 (App Router), Drizzle ORM, BetterAuth, PostgreSQL (Neon)
> **Design Philosophy:** Server-side enforcement, production-safe defaults, step forms for complex data entry
> **Last Updated:** February 4, 2026

---

## 📊 Implementation Status Overview

| Phase | Description               | Status     |
| ----- | ------------------------- | ---------- |
| 0     | Project Bootstrap         | ✅ Complete |
| 1     | Database & Schema         | ✅ Complete |
| 2     | Authentication & RBAC     | ✅ Complete |
| 3     | Admin Dashboard - Core    | ✅ Complete |
| 4     | Admin Dashboard - Full    | ✅ Complete |
| 5     | Storefront - Core         | ✅ Complete |
| 6     | Cart & Checkout           | ✅ Complete |
| 7     | Orders & Payments         | ✅ Complete |
| 8     | Customer Features         | ✅ Complete |
| 9     | SEO & Performance         | ⏳ Pending  |
| 10    | Production Readiness      | ⏳ Pending  |
| 11    | Profile & User Management | ✅ Complete |

---

## ✅ PHASE 0 — Project Bootstrap [COMPLETE]

### 0.1 Project Initialization
- [x] Next.js 16 App Router with TypeScript
- [x] ESLint configured
- [x] Tailwind CSS 4.x configured
- [x] Absolute imports (`@/` → project root)
- [x] pnpm workspace setup

### 0.2 Dependencies Installed
- [x] drizzle-orm + drizzle-kit
- [x] postgres (postgres.js)
- [x] better-auth
- [x] zod (v3.24.4 for @hookform/resolvers compatibility)
- [x] react-hook-form + @hookform/resolvers
- [x] @tanstack/react-query
- [x] lucide-react

### 0.3 UI System
- [x] Shadcn UI initialized (components.json)
- [x] Base primitives: button, input, label, card, badge, select, textarea
- [x] Form components: field, input-group
- [x] Data display: table (via Shadcn)
- [x] Feedback: alert-dialog, dropdown-menu

### 0.4 Environment Setup
- [x] `.env` with DATABASE_URL, AUTH_SECRET, SITE_URL
- [x] `.env.example` template
- [x] Neon PostgreSQL connection

---

## ✅ PHASE 1 — Database Schema [COMPLETE]

### 1.1 Drizzle Configuration
- [x] drizzle.config.ts configured
- [x] Migration system (lib/db/migrations)
- [x] Schema organization (lib/db/schema/*)

### 1.2 Auth Tables (BetterAuth Compatible)
- [x] `user` - Core user table (text ID for BetterAuth)
- [x] `session` - Active sessions
- [x] `account` - OAuth/credential accounts (password stored here)
- [x] `verification` - Email verification tokens
- [x] `roles` - System roles (customer, admin, manager, support)
- [x] `user_roles` - User-role junction table

### 1.3 Customer Domain
- [x] `customer_profiles` - Extended user info
- [x] `customer_addresses` - Shipping/billing addresses

### 1.4 Catalog Domain
- [x] `categories` - Hierarchical categories with SEO fields
- [x] `products` - Products with status, SEO, pricing
- [x] `product_variants` - SKU-level variants
- [x] `product_images` - Multiple images per product
- [x] `product_attributes` - Dynamic attributes
- [x] `product_attribute_values` - Attribute values

### 1.5 Inventory Domain
- [x] `inventory_items` - Current stock levels
- [x] `inventory_movements` - Audit ledger for stock changes

### 1.6 Cart Domain
- [x] `carts` - Guest and authenticated carts
- [x] `cart_items` - Cart line items

### 1.7 Orders Domain
- [x] `orders` - Order records with denormalized addresses
- [x] `order_items` - Order line items with denormalized product data
- [x] `order_status_history` - Status change audit trail
- [x] `shipments` - Shipping tracking

### 1.8 Payments Domain
- [x] `payments` - Payment records
- [x] `bank_transfer_proofs` - Upload proof for bank transfers

### 1.9 Reviews Domain
- [x] `reviews` - Customer reviews
- [x] `review_moderation` - Moderation actions

### 1.10 Admin Domain
- [x] `admin_activity_logs` - Admin action audit trail

### 1.11 Additional Tables
- [x] `favorites` - Customer wishlists

### 1.12 Enums
- [x] `user_role_enum` (customer, admin, manager, support)
- [x] `product_status_enum` (draft, active, archived)
- [x] `order_status_enum` (draft → delivered, cancelled, refunded)
- [x] `payment_status_enum` (pending, processing, completed, failed, refunded)
- [x] `payment_method_enum` (card, bank_transfer, cod)
- [x] `inventory_movement_type_enum` (purchase, sale, adjustment, return, reserved, released)
- [x] `address_type_enum` (shipping, billing, both)
- [x] `review_status_enum` (pending, approved, rejected)

### 1.13 Seed Data
- [x] Default roles seeded
- [x] Admin user seeded (admin@example.com / admin123)
- [x] BetterAuth-compatible password hashing

---

## ✅ PHASE 2 — Authentication & RBAC [COMPLETE]

### 2.1 BetterAuth Configuration
- [x] lib/auth.ts - BetterAuth setup with Drizzle adapter
- [x] Email/password authentication enabled
- [x] Session management (7-day expiry, 24h refresh)
- [x] Cookie caching enabled

### 2.2 Auth API Routes
- [x] app/api/auth/[...all]/route.ts - All auth endpoints

### 2.3 Auth Client
- [x] lib/auth-client.ts - Client-side auth utilities

### 2.4 RBAC System
- [x] lib/auth/rbac.ts - Server-side RBAC utilities
- [x] `getServerSession()` - Get current session
- [x] `requireAuth()` - Require authenticated user
- [x] `requireRole()` - Require specific role
- [x] `requireAdmin()` - Require admin role
- [x] `requireStaff()` - Require admin/manager/support
- [x] `requirePermission()` - Fine-grained permissions
- [x] `getUserRoles()` - Get user's roles
- [x] `hasRole()` - Check if user has role

### 2.5 Middleware Protection
- [x] middleware.ts - Protect /admin/* routes

### 2.6 Auth Pages
- [x] /auth/login - Login page with form
- [x] /auth/register - Registration page with form

---

## ✅ PHASE 3 — Admin Dashboard Core [COMPLETE]

### 3.1 Admin Layout
- [x] app/(admin)/admin/layout.tsx - Admin shell
- [x] components/admin/sidebar.tsx - Navigation sidebar
- [x] components/admin/header.tsx - Top header with user menu

### 3.2 Dashboard Home
- [x] app/(admin)/admin/page.tsx - Dashboard overview
- [x] lib/actions/dashboard.ts - Dashboard stats action
- [x] Stats cards: Orders, Products, Customers, Revenue
- [x] Recent orders list

### 3.3 Products Management
- [x] app/(admin)/admin/products/page.tsx - Products list page
- [x] components/admin/products/products-table.tsx - Data table with pagination
- [x] lib/actions/product.ts - Product CRUD actions
- [x] app/(admin)/admin/products/new/page.tsx - New product page
- [x] components/admin/products/new-product-form.tsx - Step form (4 steps)
  - Step 1: Basic Info (name, slug, description, category)
  - Step 2: Pricing & Inventory (price, compare price, SKU, stock)
  - Step 3: Images (Vercel Blob upload with drag & drop)
  - Step 4: Settings & SEO (status, featured, meta title, description)
- [x] Edit product page
- [x] Delete product confirmation
- [x] Image upload integration (Vercel Blob storage)
- [x] Image management (upload, reorder, set primary, delete)
- [ ] Bulk actions (delete, status change)

### 3.4 Categories Management
- [x] app/(admin)/admin/categories/page.tsx - Categories list page
- [x] components/admin/categories/categories-table.tsx - Data table
- [x] lib/actions/category.ts - Category CRUD actions
- [x] app/(admin)/admin/categories/new/page.tsx - New category page
- [x] components/admin/categories/new-category-form.tsx - Category form
- [x] Edit category page
- [x] Delete category (with product check)
- [ ] Category tree view

### 3.5 Orders Management
- [x] app/(admin)/admin/orders/page.tsx - Orders list page
- [x] components/admin/orders/orders-table.tsx - Data table with status badges
- [x] lib/actions/order.ts - Order actions
- [x] Order detail page
- [x] Update order status
- [x] Order status history view
- [ ] Shipment tracking management
- [ ] Print invoice/packing slip

---

## ✅ PHASE 4 — Admin Dashboard Full [COMPLETE]

### 4.1 Inventory Management
- [x] app/(admin)/admin/inventory/page.tsx - Inventory overview page
- [x] components/admin/inventory/inventory-table.tsx - Stock levels table
- [x] components/admin/inventory/low-stock-alerts.tsx - Low stock alerts
- [x] lib/actions/inventory.ts - Inventory actions
- [x] Manual stock adjustments with reason tracking
- [x] Low stock threshold management
- [x] Inventory movement history

### 4.2 Customer Management
- [x] app/(admin)/admin/customers/page.tsx - Customers list page
- [x] app/(admin)/admin/customers/[id]/page.tsx - Customer detail page
- [x] components/admin/customers/customers-table.tsx - Customers table
- [x] components/admin/customers/customer-orders.tsx - Customer orders history
- [x] components/admin/customers/customer-addresses.tsx - Customer addresses
- [x] lib/actions/customer.ts - Customer CRUD actions
- [x] Role assignment/removal

### 4.3 Reviews Moderation
- [x] app/(admin)/admin/reviews/page.tsx - Reviews management page
- [x] components/admin/reviews/review-moderation-queue.tsx - Pending reviews queue
- [x] components/admin/reviews/reviews-table.tsx - All reviews table
- [x] components/admin/reviews/review-stats.tsx - Review statistics
- [x] lib/actions/review.ts - Review moderation actions
- [x] Approve/reject actions with notes
- [x] Bulk moderation support

### 4.4 Payments Management
- [x] app/(admin)/admin/payments/page.tsx - Payments list page
- [x] components/admin/payments/payments-table.tsx - Payments table with filters
- [x] components/admin/payments/bank-transfer-queue.tsx - Bank transfer verification queue
- [x] components/admin/payments/payment-stats.tsx - Payment statistics
- [x] lib/actions/payment.ts - Payment actions
- [x] DirectPay.lk IPG integration (mock server)
- [x] app/api/payment/webhook/route.ts - Webhook handler
- [x] Bank transfer proof verification

### 4.5 Settings
- [x] app/(admin)/admin/settings/page.tsx - Store settings page
- [x] components/admin/settings/settings-form.tsx - Settings form with tabs
- [x] lib/actions/settings.ts - Settings actions
- [x] lib/utils/settings-config.ts - Setting categories configuration
- [x] lib/db/schema/admin.ts - site_settings table
- [x] Categories: General, Currency, Shipping, Orders, Reviews, Payments, SEO

### 4.6 Reports & Analytics
- [x] app/(admin)/admin/reports/page.tsx - Reports dashboard
- [x] components/admin/reports/sales-overview.tsx - Sales stats cards
- [x] components/admin/reports/sales-chart.tsx - 30-day sales chart
- [x] components/admin/reports/top-products-table.tsx - Top products by revenue
- [x] components/admin/reports/payment-methods-chart.tsx - Payment methods distribution
- [x] components/admin/reports/customer-stats.tsx - Customer statistics
- [x] components/admin/reports/order-status-chart.tsx - Order status distribution
- [x] lib/actions/reports.ts - Report generation actions
- [ ] Export to CSV

---

## ✅ PHASE 5 — Storefront Core [COMPLETE]

### 5.1 Storefront Layout
- [x] app/(storefront)/layout.tsx - Storefront shell
- [x] components/storefront/header.tsx - Navigation header
- [x] components/storefront/footer.tsx - Site footer
- [x] components/storefront/mobile-nav.tsx - Mobile navigation
- [x] components/storefront/search-dialog.tsx - Search modal

### 5.2 Home Page
- [x] app/(storefront)/page.tsx - Enhanced home page
- [x] components/storefront/home/hero-section.tsx - Hero section with CTAs
- [x] components/storefront/home/featured-categories.tsx - Featured categories grid
- [x] components/storefront/home/product-grid-section.tsx - Reusable product grid
- [x] components/storefront/home/deals-section.tsx - Products on sale
- [x] components/storefront/home/newsletter-section.tsx - Newsletter CTA
- [x] Featured products section
- [x] New arrivals section
- [x] Best sellers section

### 5.3 Category Pages
- [x] app/(storefront)/categories/page.tsx - All categories
- [x] app/(storefront)/categories/[slug]/page.tsx - Category products
- [x] Category sidebar filters
- [x] Sort options (price, newest, popular)
- [x] Pagination

### 5.4 Product Pages
- [x] app/(storefront)/products/page.tsx - All products
- [x] app/(storefront)/products/[slug]/page.tsx - Product detail
- [x] Image gallery with zoom
- [x] Variant selector
- [x] Add to cart
- [x] components/storefront/favorite-button.tsx - Add to favorites
- [x] Related products
- [x] components/storefront/product-reviews.tsx - Product reviews section
- [x] lib/actions/product-reviews.ts - Customer review actions

### 5.5 Search
- [x] app/(storefront)/search/page.tsx - Search results
- [x] app/(storefront)/search/search-results.tsx - Search results grid
- [x] app/(storefront)/search/search-filters.tsx - Search filters sidebar
- [x] lib/actions/search.ts - Search action
- [x] Full-text search implementation
- [x] Search suggestions (autocomplete)
- [x] Search filters (category, price range, sort)

### 5.6 Favorites/Wishlist
- [x] app/(storefront)/favorites/page.tsx - User favorites page
- [x] lib/actions/favorites.ts - Favorites CRUD actions
- [x] lib/actions/storefront.ts - Home page data actions

---

## ✅ PHASE 6 — Cart & Checkout [COMPLETE]

### 6.1 Cart System
- [x] lib/actions/cart.ts - Cart actions
- [x] `getOrCreateCart()` - Get/create cart for user/guest
- [x] `addToCart()` - Add item with stock validation
- [x] `updateCartItem()` - Update quantity
- [x] `removeFromCart()` - Remove item
- [x] `mergeCartsOnLogin()` - Merge guest cart with user cart

### 6.2 Cart Page
- [x] app/(storefront)/cart/page.tsx - Cart page
- [x] Cart items list
- [x] Quantity adjusters
- [x] Remove items
- [x] Cart summary
- [x] Proceed to checkout
- [x] Header cart badge with live count

### 6.3 Checkout Flow
- [x] app/(storefront)/checkout/page.tsx - Checkout page
- [x] Step 1: Contact information
- [x] Step 2: Shipping address (select or add new)
- [x] Step 3: Shipping method & payment method
- [x] Step 4: Order review
- [x] Order summary sidebar

### 6.4 Checkout Actions
- [x] lib/actions/checkout.ts - Checkout server actions
- [x] lib/schemas/checkout.ts - Checkout schemas & types
- [x] `validateCartForCheckout()` - Validate stock and prices
- [x] `createOrder()` - Create order with transaction
- [x] `getCheckoutSummary()` - Get cart summary for checkout
- [x] `getUserAddresses()` - Get saved addresses
- [x] Inventory reservation on order creation

### 6.5 Checkout Success
- [x] app/(storefront)/checkout/success/page.tsx - Success page
- [x] Order confirmation details
- [x] Shipping address display

---

## ✅ PHASE 7 — Orders & Payments [COMPLETE]

### 7.1 Order Processing
- [x] Order state machine implementation (valid transitions in order.ts)
- [x] Status history tracking
- [x] Email notifications (order placed, shipped, delivered)
- [x] lib/email/order-notifications.ts - Email templates & sending

### 7.2 Payment Integration
- [x] Payment provider abstraction (DirectPay IPG mock)
- [x] Card payment flow with DirectPay
- [x] Bank transfer flow with proof upload
- [x] Cash on delivery flow
- [x] Payment webhooks handling (api/payment/webhook)
- [x] Idempotency keys for payments
- [x] `recordCODPayment()` - COD payment action
- [x] `markCODPaymentCollected()` - Admin COD collection
- [x] `uploadBankTransferProof()` - Customer proof upload

### 7.3 Customer Order Pages
- [x] app/(storefront)/orders/page.tsx - My orders list
- [x] app/(storefront)/orders/[id]/page.tsx - Order detail
- [x] app/(storefront)/orders/[id]/bank-transfer/page.tsx - Bank transfer payment
- [x] lib/actions/customer-orders.ts - Customer order actions
- [x] Order tracking timeline component
- [x] Cancel order functionality
- [x] Order status cards (pending, processing, shipped, delivered)
- [x] Header account dropdown with orders link

---

## ✅ PHASE 8 — Customer Features

### 8.1 Profile Management
- [x] app/(storefront)/profile/page.tsx - Profile page
- [x] Edit profile form (profile-form.tsx)
- [x] Change password (password-form.tsx)
- [x] Email preferences (preferences-form.tsx)
- [x] lib/actions/profile.ts - Profile & address actions

### 8.2 Address Book
- [x] app/(storefront)/profile/addresses/page.tsx - Addresses list
- [x] app/(storefront)/profile/addresses/new/page.tsx - Add address
- [x] app/(storefront)/profile/addresses/[id]/edit/page.tsx - Edit address
- [x] address-form.tsx - Reusable address form
- [x] address-actions.tsx - Set default, delete actions
- [x] Support for shipping/billing/both address types

### 8.3 Favorites/Wishlist
- [x] lib/actions/favorites.ts - Favorites actions (Phase 5)
- [x] app/(storefront)/favorites/page.tsx - Favorites page (Phase 5)
- [x] Add to favorites button on products (Phase 5)
- [x] Move to cart from favorites (Phase 5)

### 8.4 Reviews
- [x] lib/actions/customer-reviews.ts - Customer review actions
- [x] lib/db/schema/reviews.ts - Added reviewHelpfulVotes table
- [x] app/(storefront)/profile/reviews/page.tsx - My reviews page
- [x] review-actions.tsx - Edit/delete review dialogs
- [x] Helpful votes toggle functionality
- [x] getUserReviews, updateUserReview, deleteUserReview
- [x] voteReviewHelpful, hasVotedHelpful, getUserVotes

### 8.5 Additional Features
- [x] app/(storefront)/deals/page.tsx - Deals/sale products page
- [x] lib/actions/newsletter.ts - Newsletter subscription action
- [x] lib/db/schema/newsletter.ts - Newsletter subscribers table
- [x] components/storefront/home/newsletter-section.tsx - Functional newsletter form
- [x] favorite-actions.tsx - Move to cart & remove actions
- [x] GUIDE.md - Platform usage documentation

---

## ✅ PHASE 11 — Profile Management & User Management [COMPLETE]

> **Dependencies:** BetterAuth Passkey Plugin, BetterAuth Admin Plugin, Resend (Email)
> **Goal:** Universal profile management for all actors, admin user management with invitations, passkey authentication

### 11.1 BetterAuth Plugins Setup
- [x] Install @better-auth/passkey package
- [x] Configure passkey plugin in lib/auth.ts
  - [x] Set rpID, rpName, origin options
  - [x] Configure authenticator selection preferences
- [x] Configure admin plugin in lib/auth.ts
  - [x] Define custom access control with createAccessControl()
  - [x] Define permission statements for each role
  - [x] Map permissions to roles (admin, manager, support, customer)
- [x] Update lib/auth-client.ts with passkeyClient() and adminClient()
- [x] Run database migration for passkey table
- [x] lib/db/schema/auth.ts - Add passkey table schema
- [x] lib/auth/permissions.ts - Define access control statements and roles

### 11.2 Resend Email Integration
- [x] Install resend package
- [x] lib/email/resend.ts - Resend client configuration
- [x] lib/email/send.ts - Email sending utility with templates
  - [x] welcome - Welcome email template
  - [x] staff-invitation - Staff invitation template
  - [x] password-reset - Password reset template
  - [x] password-changed - Password changed notification
  - [x] password-reset-by-admin - Admin reset notification
- [x] Environment variables: RESEND_API_KEY, EMAIL_FROM

### 11.3 Database Schema Updates
- [x] lib/db/schema/auth.ts - Add user extended fields
  - [x] mustChangePassword: boolean - Force password change on first login
  - [x] invitedBy: text - Reference to admin who invited the user
  - [x] invitedAt: timestamp - When user was invited
  - [x] lastPasswordChange: timestamp - Last password change date
- [x] lib/db/schema/auth.ts - Add passkey table (BetterAuth managed)
  - [x] id, name, publicKey, userId, credentialID
  - [x] counter, deviceType, backedUp, transports
  - [x] createdAt, aaguid
- [x] Run drizzle-kit generate && drizzle-kit push

### 11.4 Universal Profile Page (All Actors)
- [x] app/admin/profile/page.tsx - Admin/Staff profile page
- [x] components/admin/profile/profile-overview.tsx - Basic info display
  - [x] Name, email, avatar
  - [x] Role badges
  - [x] Account created date, last password change
- [x] lib/actions/staff-profile.ts - Staff profile server actions
  - [x] getStaffProfile() - Get current user profile
  - [x] updateStaffProfile() - Update profile details

### 11.5 Password Management (All Actors)
- [x] components/shared/password-change-form.tsx - Reusable password change form
  - [x] Current password field
  - [x] New password field with strength indicator
  - [x] Confirm password field
  - [x] Zod validation with password requirements
- [x] lib/utils/password-requirements.ts - Password validation utilities
  - [x] validatePassword() - Server-side strength check
  - [x] calculatePasswordStrength() - Strength calculation
  - [x] generateSecurePassword() - Secure password generation
- [x] components/shared/password-strength-indicator.tsx - Visual strength meter
- [x] components/admin/profile/security-password.tsx - Password change section
- [x] Force password change flow for new staff users
  - [x] Middleware check for mustChangePassword flag
  - [x] app/admin/change-password/page.tsx - Forced change page
  - [x] Redirect to this page if mustChangePassword is true

### 11.6 Passkey Management (All Actors)
- [x] components/shared/passkey-manager.tsx - Passkey management component
  - [x] List registered passkeys with names, device types
  - [x] Register new passkey button
  - [x] Delete passkey with confirmation
  - [x] Rename passkey functionality
- [x] components/shared/passkey-register-dialog.tsx - Register passkey modal
  - [x] Name input for passkey
  - [x] WebAuthn registration flow
- [x] components/admin/profile/security-passkeys.tsx - Passkey section card
- [x] Update login page with passkey sign-in option
  - [x] components/auth/passkey-signin-button.tsx - Passkey sign-in component
  - [x] "Sign in with Passkey" button on storefront login
  - [x] "Sign in with Passkey" button on admin login

### 11.7 Customer Profile Enhancements
- [x] Update app/(storefront)/profile/page.tsx - Add security section
- [x] components/storefront/profile/security-section.tsx - Customer security section
  - [x] Collapsible password change form
  - [x] Collapsible passkey management
- [x] Integrate password-change-form.tsx in customer profile
- [x] Profile page sections:
  - [x] Personal Information
  - [x] Security (Password & Passkeys)
  - [x] Email Preferences

### 11.8 Customer Address Management (Enhanced)
- [x] Verify existing address functionality works correctly
- [x] components/storefront/profile/address-list.tsx - Enhanced address list
  - [x] Default address badge
  - [x] Address type badges (shipping/billing/both)
  - [x] Quick actions (edit, delete, set default)
- [x] Default address selection for checkout pre-fill
- [x] Maximum addresses limit (configurable, default: 10)

### 11.9 Admin User Management Dashboard
- [x] app/admin/users/page.tsx - Staff users list page
- [x] components/admin/users/staff-users-table.tsx - Staff users data table
  - [x] Columns: Name, Email, Role(s), Status, Actions
  - [x] Filter by role
  - [x] Search by name/email
  - [x] Pagination
- [x] lib/actions/admin-users.ts - Admin user management actions
  - [x] listStaffUsers() - List all non-customer users
  - [x] getStaffUser() - Get single user details
  - [x] updateStaffUser() - Update user details
  - [x] banStaffUser() - Ban user with reason
  - [x] unbanStaffUser() - Unban user
  - [x] deleteStaffUser() - Remove user

### 11.10 Create Staff User Flow
- [x] app/admin/users/new/page.tsx - New staff user page
- [x] components/admin/users/create-staff-form.tsx - Create user form
  - [x] Name and email fields
  - [x] Role Selection (admin, manager, support)
  - [x] Send invitation
- [x] lib/actions/admin-users.ts - createStaffUser() action
  - [x] Generate temporary password (secure random)
  - [x] Create user with mustChangePassword=true
  - [x] Assign selected role
  - [x] Send invitation email with credentials
- [x] lib/utils/password-requirements.ts - Secure password generation

### 11.11 Staff Invitation Email Flow
- [x] lib/email/send.ts - staff-invitation template
  - [x] Welcome message
  - [x] Login URL
  - [x] Temporary password
  - [x] Instructions to change password
- [x] Password reset by admin email template

### 11.12 First-Time Login Password Change
- [x] Middleware enhancement in middleware.ts
  - [x] Check mustChangePassword flag via cookie
  - [x] Redirect to /admin/change-password if true
  - [x] Allow only change-password page and logout
- [x] app/admin/change-password/page.tsx - Force change page
- [x] components/admin/auth/first-time-password-change.tsx
  - [x] New password with requirements
  - [x] Confirm password
- [x] lib/actions/admin-auth.ts - changeFirstTimePassword()
- [x] After successful change:
  - [x] Set mustChangePassword=false
  - [x] Update lastPasswordChange timestamp
  - [x] Clear must-change-password cookie
  - [x] Redirect to dashboard

### 11.13 Role & Permission Management
- [x] lib/auth/permissions.ts - Permission definitions
  - [x] Resource types: product, category, order, inventory, payment, review, customer, staff, settings, reports
  - [x] Actions per resource: create, read, update, delete
  - [x] Role mappings with specific permissions
- [x] app/admin/users/roles/page.tsx - Roles overview page
- [x] components/admin/users/roles-table.tsx - Roles list with permission matrix
- [x] Permission check integration in existing admin actions
  - [x] Update lib/auth/rbac.ts with permission checks
  - [x] hasResourcePermission() and requireResourcePermission() functions

### 11.14 Staff User Detail Page (Enhanced)
- [x] app/admin/users/[userId]/page.tsx - Staff user detail page
- [x] components/admin/users/staff-user-detail.tsx - User detail component (tabbed interface)
  - [x] Avatar, name, email, status
  - [x] Role badges
  - [x] Edit user form
  - [x] Action buttons (reset password, ban/unban, delete)
- [x] Tabbed interface with:
  - [x] Overview tab: Basic info, dates, invited by, quick stats
  - [x] Activity tab: Recent actions (from admin_activity_logs)
  - [x] Sessions tab: Active sessions list with management
  - [x] Security tab: Password reset, ban/unban, delete actions
- [x] components/admin/users/user-sessions-table.tsx - Active sessions
  - [x] Device, browser, OS detection from user agent
  - [x] IP address display
  - [x] Revoke single session action
  - [x] Revoke all sessions action
- [x] components/admin/users/user-activity-log.tsx - Activity log display
  - [x] Action formatting with icons and colors
  - [x] Entity type badges
  - [x] Timestamps and IP addresses

### 11.15 Staff Password Reset (Admin Action)
- [x] Reset password dialog in staff-users-table.tsx and staff-user-detail.tsx
- [x] lib/actions/admin-users.ts - resetStaffPassword()
  - [x] Set mustChangePassword=true
  - [x] Send reset notification email

### 11.16 Session Management
- [x] components/admin/profile/active-sessions.tsx - View active sessions
  - [x] List all user's sessions
  - [x] Current session indicator
  - [x] Device info, IP
  - [x] Revoke other sessions
- [x] lib/actions/staff-profile.ts - Session management actions
  - [x] getUserSessions() - Get all sessions
  - [x] revokeSession() - Revoke specific session
  - [x] revokeAllOtherSessions() - Revoke all except current
- [ ] Add to customer profile security section

### 11.17 Admin Activity Logging Enhancement
- [x] lib/actions/activity-log.ts - Activity logging utility
  - [x] logActivity() - Log admin actions
  - [x] ActivityAction types for all admin actions
- [x] Update lib/actions/admin-users.ts - Log all user management actions
  - [x] User created, updated, deleted
  - [x] Role changed
  - [x] Password reset
  - [x] User banned/unbanned
- [ ] components/admin/users/user-activity-log.tsx - Activity display (optional)

### 11.18 Login Page Updates
- [x] app/admin/login/page.tsx - Admin login page
- [x] components/admin/auth/admin-login-form.tsx - Admin login form
  - [x] Staff-only login check
  - [x] Ban check
  - [x] Set must-change-password cookie
  - [x] Passkey sign-in button
- [x] components/auth/passkey-signin-button.tsx - Passkey login component
- [x] Update login pages with passkey option
  - [x] Storefront login page
  - [x] Admin login page

### 11.19 Security Enhancements
- [x] lib/utils/password-requirements.ts - Password policy configuration
  - [x] Minimum length: 12 characters
  - [x] Require uppercase, lowercase, number, special char
  - [x] Cannot contain email or name
- [ ] Password breach check integration (Have I Been Pwned plugin - optional)
- [ ] Session invalidation on password change
- [ ] Email notification on security events:
  - [x] Password changed
  - [ ] New passkey registered
  - [ ] New device login
  - [ ] Account banned

### 11.20 Environment Variables
- [x] Add to .env.example:
  - [x] RESEND_API_KEY - Resend API key
  - [x] EMAIL_FROM - Default from email address
  - [x] PASSKEY_RP_ID - Passkey relying party ID
  - [x] PASSKEY_RP_NAME - Passkey relying party name

---

## ⏳ PHASE 9 — SEO & Performance

### 9.1 SEO
- [ ] Product JSON-LD structured data
- [ ] Category JSON-LD
- [ ] Organization JSON-LD
- [ ] Dynamic sitemap.xml
- [ ] robots.txt
- [ ] Open Graph meta tags
- [ ] Twitter cards

### 9.2 Performance
- [ ] Image optimization with next/image
- [ ] ISR for product pages
- [ ] Static generation for categories
- [ ] API response caching
- [ ] Database query optimization

### 9.3 Analytics
- [ ] Page view tracking
- [ ] Event tracking (add to cart, checkout, purchase)
- [ ] Analytics dashboard integration

---

## ⏳ PHASE 10 — Production Readiness

### 10.1 Security
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] Rate limiting on checkout
- [ ] Input sanitization
- [ ] SQL injection prevention (Drizzle handles)
- [ ] XSS prevention

### 10.2 Error Handling
- [ ] Global error boundary
- [ ] API error responses standardization
- [ ] Error logging
- [ ] User-friendly error pages (404, 500)

### 10.3 Testing
- [ ] Unit tests for actions
- [ ] Integration tests for checkout flow
- [ ] E2E tests for critical paths

### 10.4 Deployment
- [ ] Vercel configuration
- [ ] Environment variables setup
- [ ] Database migrations in CI/CD
- [ ] Health check endpoint
- [ ] Monitoring setup

---

## 🎯 Current Sprint Focus

**Priority 1 - Profile & User Management (Phase 11):**
1. [ ] BetterAuth Passkey & Admin plugin setup
2. [ ] Resend email integration
3. [ ] Universal profile page for all actors
4. [ ] Password & passkey management
5. [ ] Admin user management with invitations
6. [ ] First-time login password change flow
7. [ ] Role & permission system

---

## 📝 Notes

### Design Decisions
- **Step Forms**: Used for complex data entry (products, checkout) to reduce cognitive load
- **Server Actions**: All mutations go through server actions with Zod validation
- **Denormalized Data**: Order items store product snapshots for historical accuracy
- **Ledger Pattern**: Inventory uses movement ledger for full auditability

### Known Issues
- [ ] React Hook Form + Zod compatibility requires Zod 3.x (not 4.x)
- [ ] BetterAuth password hashing requires using `better-auth/crypto`
- [ ] Next.js 16 middleware deprecation warning (use proxy pattern)

### Credentials (Development Only)
- **Admin Login**: admin@example.com / admin123
