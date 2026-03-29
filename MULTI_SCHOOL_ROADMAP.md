# Multi-School SaaS Platform Roadmap
## BAB UL ILM School Management System

---

## Overview
Transform from single-school to multi-tenant SaaS platform where multiple schools can:
- Sign up independently 
- Buy credits to use the software
- Manage their own students, fees, and data
- Have isolated data (RLS policies)

---

## Phase 1: Foundation (Core Schema Changes)

### 1.1 Create schools Table
```sql
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  credits INTEGER DEFAULT 0,
  credit_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  total_paid DECIMAL(10,2) DEFAULT 0,
  last_payment_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id)
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
```

### 1.2 Create school_credits Table
```sql
CREATE TABLE public.school_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  amount_paid DECIMAL(10,2),
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE school_credits ENABLE ROW LEVEL SECURITY;
```

### 1.3 Add school_id to All Tables
Update existing tables with school_id and RLS.

---

## Phase 2: Credit System & Payments

### Pricing Model
- Starter: 500 credits for PKR 5,000
- Standard: 1,200 credits for PKR 10,000  
- Premium: 3,000 credits for PKR 20,000

### Payment Methods
- Bank Transfer (manual verification)
- EasyPaisa
- JazzCash

---

## Implementation Checklist

### Database
- [ ] Create schools table
- [ ] Create school_credits table
- [ ] Add school_id to all tables
- [ ] Create credit consumption function
- [ ] Update all RLS policies

### Frontend
- [ ] New landing page
- [ ] Signup flow
- [ ] Onboarding wizard
- [ ] Billing/credits page
- [ ] Payment submission form
- [ ] Credit balance widget

### Security
- [ ] Update RLS policies
- [ ] Credit check middleware
- [ ] School isolation verification
