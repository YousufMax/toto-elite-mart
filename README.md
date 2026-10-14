# Toto Elite Mart (Full-Stack Platform)

Production-oriented, zero-recurring-cost e-commerce platform and business management ERP for **Toto Elite Mart** (Bangladesh). 

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL (Prisma ORM)**, **Google Sheets API**, **Telegram Bot API**, and **ImageKit CDN**.

---

## 🚀 Key Features

### 1. Storefront (Customer-Facing)
- **Bangladesh-First E-Commerce**: Default currency in **BDT (৳)** using integer paisa precision math (zero floating-point inaccuracy).
- **Cash on Delivery (COD)**: Functional checkout with BD mobile number validation (`01XXXXXXXXX`), delivery zones (*Inside Dhaka ৳60*, *Outside Dhaka ৳120*).
- **Coupon System**: Server-side coupon verification (e.g. `WELCOME100` for ৳100 off, `ELITE10` for 10% off).
- **Order Tracking**: Public order lookup by Order Number + Phone number with a 6-stage interactive delivery stepper.
- **Persistent Cart**: Client-side slide-over drawer and cart page synced with `localStorage`.
- **Catalog & Search**: Fast search, category filters, price sorting, low-stock warnings, and related product recommendations.

### 2. Admin ERP & Business Dashboard (`/admin`)
- **Real-Time KPIs**: Live metrics for Total Orders, Delivered Revenue, Cash Collected, Receivables, COGS, Expenses, Gross Profit, and Net Operating Result.
- **Order Management**: Search, filter, status transition stepper (*Pending → Confirmed → Processing → Packed → Shipped → Delivered → Cancelled*), payment status, and printable invoices.
- **Product & Catalog Management**: Create, edit, and deactivate products with ImageKit CDN media support and unique SKU validation.
- **Inventory Ledger**: Track stock additions, deductions, low-stock alerts, adjustment reasons, and employee IDs.
- **Expense Tracker**: Track operating expenses (packaging, logistics, rent, marketing) for accurate net profit calculation.
- **Staff & RBAC**: Role-Based Access Control (*Super Admin*, *Order Manager*, *Inventory Manager*, *Accountant*, *Staff*).

### 3. Enterprise Integrations
- **Google Sheets API**: Automated, idempotent synchronization of `Products`, `Orders`, and `Expenses` with formula-injection sanitization.
- **Telegram Bot API**: Database-backed notification outbox with exponential backoff and retry. Instant notifications for new customer orders, cancellations, and low-stock warnings.
- **ImageKit CDN**: Free-plan image hosting (20GB bandwidth + 20GB media storage free). Private keys remain strictly server-side; short-lived authentication signatures are generated for client-side uploads.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL (Prisma ORM with migrations, foreign keys, transactions, and audit logs)
- **Authentication**: Signed HTTP-only session JWT cookies (`jose`), `bcryptjs` password hashing
- **Hosting Tier**: 100% Free Tier Compatible (Vercel / Render + Supabase Free PostgreSQL + ImageKit Free + Google Cloud Free)

---

## 📦 Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toto_elite_mart?schema=public"
JWT_SECRET="your_secure_jwt_secret"

# Telegram Bot (Optional for local testing)
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Google Sheets (Optional for local testing)
GOOGLE_SHEETS_SPREADSHEET_ID="your_spreadsheet_id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your_service_account_email"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# ImageKit Free CDN
IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_id"
```

### 3. Generate Database Client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

---

## 🔑 Default Demo Admin Credentials
- **Super Administrator**:
  - Email: `admin@totoelitemart.com`
  - Password: `admin123`
- **Order Operations Manager**:
  - Email: `orders@totoelitemart.com`
  - Password: `admin123`

---

## 📋 Integration Guides

### Google Sheets Setup
1. In Google Cloud Console, enable the **Google Sheets API**.
2. Create a **Service Account** and generate a JSON key.
3. Create a Google Spreadsheet and share it with the service account email (as Editor).
4. Paste the credentials and Spreadsheet ID into `.env`.
5. Visit `/admin/integrations` and click **"Sync Now to Google Sheets"**.

### Telegram Bot Setup
1. Message `@BotFather` on Telegram to create a bot and receive your bot token.
2. Add the bot to your administrative group.
3. Obtain your Chat ID using `@userinfobot`.
4. Enter the token and chat ID in `.env`.
5. Visit `/admin/integrations` and click **"Send Test Notification to Telegram"**.

---

## 🧪 Testing & Build Verification
To test TypeScript compilation and build production assets:
```bash
npm run build
```
