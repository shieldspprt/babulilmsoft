# Fee Receipt Implementation Plan

## Overview
Generate professional fee receipts for parents with print, PDF, and WhatsApp sharing options.

---

## Receipt Layout

```
┌─────────────────────────────────────────┐
│         [SCHOOL LOGO]                   │
│         ABC SCHOOL                      │
│    123 Main Street, City                │
│    Phone: 03XX-XXXXXXX                  │
│─────────────────────────────────────────│
│                                         │
│  RECEIPT #R-2026-0001                   │
│  Date: 01-Apr-2026                      │
│                                         │
│  Parent: Shahbaz Ali                    │
│  Contact: 03XX-XXXXXXX                  │
│─────────────────────────────────────────│
│                                         │
│  STUDENT FEE DETAILS                    │
│  ─────────────────────────────────────  │
│  Student          Class       Monthly Fee │
│  ─────────────────────────────────────  │
│  1. Ali Khan       Grade-3     Rs 2,500 │
│  2. Sara Khan      Grade-5     Rs 3,000 │
│  ─────────────────────────────────────  │
│  GROSS FEE:                    Rs 5,500  │
│  Less: Discount                  -500   │
│  ─────────────────────────────────────  │
│  NET MONTHLY FEE:              Rs 5,000 │
│                                         │
│  ─────────────────────────────────────  │
│  Previous Balance/Advance:     Rs 1,000 │
│  (Negative = Advance, Positive = Due)   │
│                                         │
│  TOTAL PAYABLE:                Rs 4,000 │
│  ─────────────────────────────────────  │
│                                         │
│  PAYMENT RECEIVED:             Rs 4,000 │
│  Payment Mode: Cash                     │
│  Paid For: Jan, Feb, Mar 2026          │
│  ─────────────────────────────────────  │
│                                         │
│  NEW BALANCE/ADVANCE:           Rs 0    │
│  ✓ Account Cleared                    │
│                                         │
│  [QR CODE: Scan to verify]              │
│                                         │
│  ──── [Authorized Signature] ─────      │
│                                         │
│  This is computer generated receipt     │
└─────────────────────────────────────────┘
```

---

## Data Requirements

| Source Table | Fields Needed |
|--------------|---------------|
| `schools` | name, address, contact, logo_url |
| `parents` | first_name, last_name, contact, cnic |
| `students` | first_name, last_name, monthly_fee, discount_type, discount_value, active=true |
| `classes` | name, monthly_fee |
| `fee_payments` | amount, payment_method, months_paid, payment_date |

---

## Calculated Fields

| Field | Formula |
|-------|---------|
| **Gross Fee** | SUM(student.monthly_fee) |
| **Total Discount** | SUM(calculated discount per student) |
| **Net Monthly Fee** | Gross Fee - Total Discount |
| **Previous Balance** | (Months × Net Monthly Fee) - Total Paid So Far |
| **Total Payable** | Net Monthly Fee + Previous Balance |
| **Payment Received** | Current payment amount |
| **New Balance** | Total Payable - Payment Received |

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS public.fee_receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no      text NOT NULL UNIQUE,
  school_id       uuid NOT NULL REFERENCES schools(id),
  parent_id       uuid NOT NULL REFERENCES parents(id),
  payment_id      uuid NOT NULL REFERENCES fee_payments(id),
  receipt_data    jsonb NOT NULL,
  sent_via        text[],
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_fee_receipts_parent ON fee_receipts(parent_id, created_at DESC);
CREATE INDEX idx_fee_receipts_receipt_no ON fee_receipts(receipt_no);
```

---

## Components to Build

1. **ReceiptGenerator.tsx** - Generate receipt data from payment
2. **ReceiptPreview.tsx** - Visual receipt preview modal
3. **ReceiptPrintView.tsx** - Print-optimized component
4. **ReceiptActions.tsx** - Print/Download/Send buttons
5. **useReceipt.ts** - Hook for receipt operations

---

## Receipt Number Format

**R-YYYY-XXXX** (e.g., R-2026-0042)
- R = Receipt prefix
- YYYY = Year
- XXXX = Sequential number

---

## Sharing Options

- [ ] **Print** - 80mm thermal printer optimized
- [ ] **PDF Download** - A4 size receipt
- [ ] **WhatsApp** - Share as image/PDF
- [ ] **Email** - Send PDF attachment
- [ ] **QR Code** - Scan to verify receipt online

---

## UI Flow

```
[Record Payment] → Success → [Generate Receipt?]
                                  ↓
                    ┌─────────────────────┐
                    │   Receipt Preview   │
                    │                     │
                    │ [Print] [Download]  │
                    │ [WhatsApp] [Close]  │
                    └─────────────────────┘
```
