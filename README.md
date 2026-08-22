# SellTrack - E-Commerce Business Manager

A complete **Order, Return, Payment & Profit Management** application for sellers on **Amazon, Flipkart, and Meesho**.

## Features

- **Order Management** – Add orders with auto-calculated expected payment date (Order Date + 15 days)
- **Barcode Scanner** – Scan products using mobile camera to auto-fill product details
- **Return Management** – Process returns with automatic profit/stock recalculation
- **Payment Tracking** – Track pending, paid, and overdue payments
- **Profit Calculation** – Automatic gross and net profit/loss on every order
- **Product & Stock Management** – Track available, returned, damaged, and lost stock
- **Expense Tracking** – Record and categorize business expenses
- **Dashboard & Analytics** – Today, monthly, and overall business metrics with charts
- **Platform Reports** – Amazon vs Flipkart vs Meesho comparison
- **Reports Export** – Export to CSV, Excel, and PDF
- **Notifications** – Payment due, low stock, and return rate alerts
- **Data Backup** – Export/import JSON backup, server-side database storage
- **Mobile-First** – Responsive design with bottom navigation and quick scan button

## Tech Stack

- **Next.js 15** (App Router)
- **Prisma** + SQLite (dev) / PostgreSQL (production)
- **NextAuth.js** for authentication
- **Tailwind CSS** for styling
- **Recharts** for dashboard charts
- **html5-qrcode** for barcode scanning

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up database

```bash
npx prisma db push
npm run db:seed
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Login

- **Email:** demo@selltrack.app
- **Password:** demo123

## Production Deployment

### Use PostgreSQL (recommended for cloud)

Update `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/selltrack"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="https://your-domain.com"
```

Then run:

```bash
npx prisma db push
```

Deploy to **Vercel**, **Railway**, or any Node.js host.

## Navigation

| Section | Description |
|---------|-------------|
| Dashboard | Business overview, charts, analytics |
| Orders | Add, search, filter orders |
| Scan | Barcode scanner (prominent mobile button) |
| Returns | Process returns with auto-calculations |
| Products | Product master with stock management |
| Payments | Payment tracking and mark as paid |
| Expenses | Business expense records |
| Reports | Generate and export reports |
| Settings | Backup, import, account |

## Profit Formula

```
Gross Profit = Selling Price - Product Cost
Net Profit = Selling Price - Product Cost - Platform Commission - Shipping - GST/Tax - Return Charges - Other Expenses
```

## License

Private use for your business.
