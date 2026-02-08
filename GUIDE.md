# IUS Shop Platform Guide

A comprehensive guide to using the IUS Shop e-commerce platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Customer Guide](#customer-guide)
- [Admin Guide](#admin-guide)
- [Features Overview](#features-overview)
- [Developer Setup](#developer-setup)

---

## Getting Started

### System Requirements

- Node.js 18+ or Bun
- PostgreSQL database
- pnpm (package manager)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `BETTER_AUTH_SECRET` - Authentication secret key
   - `BETTER_AUTH_URL` - Base URL for authentication
   - `UPLOADTHING_SECRET` - For file uploads (optional)

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Seed the database (optional):
   ```bash
   pnpm db:seed
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

---

## Customer Guide

### Registration & Login

#### Creating an Account

1. Navigate to `/auth/register`
2. Enter your details:
   - Full Name
   - Email Address
   - Password (minimum 8 characters)
3. Click "Create Account"
4. You'll be automatically logged in

#### Logging In

1. Go to `/auth/login`
2. Enter your email and password
3. Click "Sign In"
4. Optional: Check "Remember me" for persistent sessions

#### Password Recovery

1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check your inbox for a reset link
4. Follow the link to set a new password

### Browsing & Shopping

#### Finding Products

- **Homepage**: Featured products, new arrivals, and deals
- **Products Page** (`/products`): Browse all products with filters
- **Categories**: Use navigation menu or `/categories` page
- **Search**: Use the search bar to find specific products
- **Deals** (`/deals`): Products currently on sale

#### Product Filters

On the products page, you can filter by:
- **Category**: Select specific product categories
- **Price Range**: Set minimum and maximum price
- **Sort**: Price (low/high), newest, popularity
- **Search**: Keyword search within products

#### Product Details

Each product page shows:
- Product images gallery
- Name, description, and specifications
- Price (with sale price if discounted)
- Available variants (size, color, etc.)
- Stock availability
- Customer reviews and ratings
- Related products

### Cart & Checkout

#### Adding to Cart

1. Select product options (if any)
2. Choose quantity
3. Click "Add to Cart"
4. Continue shopping or proceed to cart

#### Managing Cart

- View cart via header icon or `/cart`
- Update quantities
- Remove items
- See order subtotal
- Apply coupon codes

#### Checkout Process

1. **Login Required**: Sign in or create account
2. **Shipping Address**: Enter or select saved address
3. **Shipping Method**: Choose delivery option
4. **Payment**: Enter payment details
5. **Review**: Confirm order details
6. **Place Order**: Submit your order

### Favorites (Wishlist)

#### Adding Favorites

- Click the heart icon on any product card
- Or click "Add to Favorites" on product page

#### Managing Favorites

- View all favorites at `/favorites`
- **Move to Cart**: Transfer item directly to shopping cart
- **Remove**: Delete from favorites list

### Account Management

#### Profile (`/profile`)

- Update personal information
- Change display name and email
- Set language preferences
- Manage marketing preferences

#### Password Change

- Current password required
- New password must be 8+ characters
- Confirmation must match

#### Address Book (`/profile/addresses`)

- Add multiple shipping/billing addresses
- Set default address for faster checkout
- Edit or delete existing addresses
- Address types: Shipping, Billing, or Both

#### Order History (`/profile/orders`)

- View all past orders
- Track order status
- View order details and invoices
- Reorder previous purchases

#### My Reviews (`/profile/reviews`)

- See all reviews you've submitted
- Edit or delete your reviews
- Track helpful votes received

### Newsletter

- Subscribe via footer email form
- Receive updates on:
  - New products
  - Sales and promotions
  - Store news
- Unsubscribe anytime via profile settings

---

## Admin Guide

### Admin Access

#### Default Admin Credentials

After seeding the database:
- **Email**: `admin@example.com`
- **Password**: `admin123`

> ⚠️ **Important**: Change these credentials immediately in production!

#### Admin Dashboard

Access via `/admin` after logging in with admin account.

### Dashboard Overview (`/admin`)

Quick stats showing:
- Total orders
- Total revenue
- Total customers
- Total products
- Recent orders
- Popular products
- Revenue charts

### Product Management

#### Products (`/admin/products`)

- **List View**: All products with search and filters
- **Create**: Add new products with:
  - Basic info (name, slug, description)
  - Pricing (base price, compare price)
  - Categories assignment
  - Product variants (SKU, size, color)
  - Inventory tracking
  - SEO metadata
  - Images upload

- **Edit**: Modify existing products
- **Delete**: Remove products (with confirmation)

#### Categories (`/admin/categories`)

- Create hierarchical categories
- Set category images and descriptions
- Manage parent-child relationships
- Control visibility (active/inactive)

#### Inventory (`/admin/inventory`)

- Track stock levels per variant
- Set low stock alerts
- Update quantities
- View inventory history

### Order Management (`/admin/orders`)

#### Order List

- View all orders with status filters
- Search by order number or customer
- Quick status updates

#### Order Statuses

1. **Pending**: Order placed, awaiting processing
2. **Processing**: Order being prepared
3. **Shipped**: Order dispatched
4. **Delivered**: Order received by customer
5. **Cancelled**: Order cancelled

#### Order Details

- Customer information
- Shipping address
- Order items and quantities
- Payment status
- Order notes
- Status history

### Customer Management (`/admin/customers`)

- View registered customers
- See customer order history
- View customer details
- Manage customer accounts

### Reviews Management (`/admin/reviews`)

- View all product reviews
- Approve/reject reviews
- Delete inappropriate content
- See review statistics

### Coupons (`/admin/coupons`)

#### Creating Coupons

- **Code**: Unique coupon code
- **Type**: Percentage or fixed amount
- **Value**: Discount value
- **Minimum Order**: Required order minimum
- **Usage Limit**: Total uses allowed
- **Per User Limit**: Uses per customer
- **Expiration**: Valid date range
- **Product/Category Restrictions**

### Settings (`/admin/settings`)

#### General Settings

- Store name and logo
- Contact information
- Currency and locale

#### Shipping Settings

- Shipping zones
- Shipping rates
- Free shipping thresholds

#### Tax Settings

- Tax rates by region
- Tax inclusion settings

#### Email Settings

- SMTP configuration
- Email templates

---

## Features Overview

### For Customers

| Feature            | Description                            |
| ------------------ | -------------------------------------- |
| User Registration  | Create account with email verification |
| Product Browsing   | Categories, filters, search            |
| Shopping Cart      | Add, update, remove items              |
| Favorites          | Save products for later                |
| Order Tracking     | Real-time order status                 |
| Reviews            | Rate and review products               |
| Profile Management | Edit personal info, addresses          |
| Order History      | View past purchases                    |

### For Admins

| Feature             | Description                  |
| ------------------- | ---------------------------- |
| Dashboard           | Sales analytics and stats    |
| Product Management  | CRUD operations for products |
| Category Management | Hierarchical categories      |
| Inventory Tracking  | Stock management             |
| Order Processing    | Status updates, fulfillment  |
| Customer Management | View and manage customers    |
| Review Moderation   | Approve/reject reviews       |
| Coupon System       | Discounts and promotions     |

---

## Developer Setup

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: BetterAuth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Jolly UI)
- **File Uploads**: UploadThing

### Project Structure

```
├── app/
│   ├── (storefront)/     # Customer-facing pages
│   ├── (admin)/          # Admin dashboard
│   ├── api/              # API routes
│   └── auth/             # Authentication pages
├── components/
│   ├── admin/            # Admin components
│   ├── storefront/       # Storefront components
│   └── ui/               # UI primitives
├── lib/
│   ├── actions/          # Server actions
│   ├── auth/             # Auth configuration
│   └── db/               # Database schema & queries
```

### Key Commands

```bash
# Development
pnpm dev                 # Start dev server

# Database
pnpm db:generate         # Generate migrations
pnpm db:push             # Push schema to database
pnpm db:studio           # Open Drizzle Studio
pnpm db:seed             # Seed sample data

# Build
pnpm build               # Production build
pnpm start               # Start production server

# Linting
pnpm lint                # Run ESLint
```

### Environment Variables

| Variable             | Description                  | Required |
| -------------------- | ---------------------------- | -------- |
| `DATABASE_URL`       | PostgreSQL connection string | Yes      |
| `BETTER_AUTH_SECRET` | Auth secret (32+ chars)      | Yes      |
| `BETTER_AUTH_URL`    | Base URL for auth            | Yes      |
| `UPLOADTHING_SECRET` | UploadThing API key          | No       |
| `UPLOADTHING_APP_ID` | UploadThing app ID           | No       |

---

## Support

For issues or questions:
1. Check this documentation
2. Review the codebase
3. Open an issue on the repository

---

*Last updated: 2024*
