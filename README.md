# MultiSchool - Multi-Tenant School Management SaaS Platform

A comprehensive SaaS platform for managing multiple schools, built with modern web technologies.

## About

MultiSchool transforms from a single-school management system into a multi-tenant SaaS platform where multiple schools can:
- Sign up independently
- Buy credits to use the software
- Manage their own students, fees, and data
- Have isolated data with RLS policies

## Architecture

### Backend (Supabase)
- **PostgreSQL** with Row Level Security (RLS)
- **Multi-tenant architecture** with school isolation

### Phase 1: Foundation
- Schools table with owner references
- School Credits table for billing
- Credit consumption function
- Updated RLS policies across all tables

### Phase 2: Credit System & Payments
**Pricing Tiers:**
- Starter: 500 credits for PKR 5,000
- Standard: 1,200 credits for PKR 10,000
- Premium: 3,000 credits for PKR 20,000

**Payment Methods:**
- Bank Transfer (manual verification)
- EasyPaisa
- JazzCash

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase
- **Router:** React Router
- **Query:** TanStack Query
- **Icons:** Lucide React

## Features

### Core Modules
- **Student Enrollment** - Complete student registration with parent records
- **Fee Collection** - Fee management and receipt generation
- **Accounts Management** - Income/expense tracking with category management
- **Teacher Management** - Staff records and assignments
- **Class Management** - Class/section organization
- **Supplier Management** - Vendor transactions and reports
- **Book Sales** - Inventory and sales tracking
- **Reports** - Comprehensive analytics and exports

### Mobile-First Design
- PWA support with offline capabilities
- Responsive mobile interface
- Touch-optimized workflows
- Haptic feedback for interactions

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Credit System

Schools operate on a credit-based model:
- Actions consume credits (enrollment, fee collection, etc.)
- Low credit alerts at 100 remaining
- Auto-suspension at 0 credits
- Top-up via payment dashboard

## Project Structure

```
src/
├── components/        # UI components
├── pages/            # Route pages
│   ├── mobile/       # Mobile-optimized pages
├── hooks/            # Custom React hooks
├── lib/              # Utilities
├── integrations/     # Supabase client
└── content/          # Static content
```

## License

Private - All rights reserved
