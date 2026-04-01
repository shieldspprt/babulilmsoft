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

---

## Phase-by-Phase Implementation Checklist

### PHASE 1: Database & Types (Priority: CRITICAL)

- [ ] **1.1 Run SQL Migration**
```sql
CREATE TABLE IF NOT EXISTS public.fee_receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no      text NOT NULL UNIQUE,
  school_id       uuid NOT NULL REFERENCES public.schools(id),
  parent_id       uuid NOT NULL REFERENCES public.parents(id),
  payment_id      uuid NOT NULL REFERENCES public.fee_payments(id),
  receipt_data    jsonb NOT NULL,
  sent_via        text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_fee_receipts_parent ON public.fee_receipts(parent_id, created_at DESC);
CREATE INDEX idx_fee_receipts_receipt_no ON public.fee_receipts(receipt_no);

ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select" ON public.fee_receipts 
  FOR SELECT USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "receipts_insert" ON public.fee_receipts 
  FOR INSERT WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
```

- [ ] **1.2 Create TypeScript Types** (`src/components/FeeReceipt/types.ts`)

- [ ] **1.3 Create Receipt Calculator** (`src/utils/receiptCalculator.ts`)

- [ ] **1.4 Create Receipt Number Generator** (R-YYYY-XXXX format)

### PHASE 2: UI Components (Priority: HIGH)

- [ ] **2.1 ReceiptContainer.tsx** - Main receipt wrapper
- [ ] **2.2 ReceiptHeader.tsx** - School name, logo, address
- [ ] **2.3 ReceiptParentInfo.tsx** - Parent name, contact, CNIC
- [ ] **2.4 ReceiptStudentList.tsx** - Table with Student, Class, Fee, Discount, Final Fee
- [ ] **2.5 ReceiptSummary.tsx** - Gross Fee, Total Discount, Net Monthly Fee, Previous Balance, Total Payable, Payment Received, New Balance/Advance
- [ ] **2.6 ReceiptFooter.tsx** - QR Code, Signature line, Terms
- [ ] **2.7 ReceiptActions.tsx** - Print, Download PDF, WhatsApp buttons

### PHASE 3: Output Features (Priority: MEDIUM)

- [ ] **3.1 Print Styles** (`src/styles/receipt-print.css`) - Optimized for 80mm thermal printer
- [ ] **3.2 PDF Generation** - Using html2canvas + jsPDF
- [ ] **3.3 WhatsApp Sharing** - Generate message and open WhatsApp Web/APP
- [ ] **3.4 QR Code Generation** - For online verification

### PHASE 4: Integration (Priority: HIGH)

- [ ] **4.1 Add "Generate Receipt" button after successful payment**
- [ ] **4.2 Save receipt to database when generated**
- [ ] **4.3 Show receipt history for a parent**
- [ ] **4.4 Re-print old receipts**

### PHASE 5: Testing & Polish (Priority: MEDIUM)

- [ ] **5.1 Test with multiple students**
- [ ] **5.2 Test with discounts**
- [ ] **5.3 Test with previous balance/advance**
- [ ] **5.4 Test print on 80mm paper**
- [ ] **5.5 Test on mobile**

---

## Component Architecture

```
src/components/FeeReceipt/
├── index.ts                    # Exports
├── types.ts                    # TypeScript interfaces
├── ReceiptContainer.tsx        # Main layout
├── ReceiptView.tsx             # The actual receipt
├── ReceiptPreview.tsx          # Modal wrapper
├── ReceiptHeader.tsx           # School info
├── ReceiptParentInfo.tsx       # Parent details
├── ReceiptStudentList.tsx      # Students table
├── ReceiptSummary.tsx          # Financial summary
├── ReceiptFooter.tsx           # QR + signature
├── ReceiptActions.tsx          # Action buttons
└── hooks/
    └── useReceiptGenerator.ts  # Generate receipt data

src/styles/
├── receipt-print.css           # Print styles

src/utils/
├── receiptCalculator.ts        # Math functions
├── receiptFormatter.ts         # Format helpers
└── receiptNumber.ts            # Generate R-YYYY-XXXX
```

---

## Integration in FeeManager

After successful payment (`recordPayment`):

```typescript
// Show success toast
showFlash('Payment recorded! Generating receipt...');

// Auto-generate and show receipt
const receipt = await generateReceipt(savedPayment);
setShowReceiptModal(true);
setCurrentReceipt(receipt);
```

Modal UI:
```
┌─────────────────────────────────────────┐
│  Receipt Preview                        │
├─────────────────────────────────────────┤
│  [REceipt View Here]                    │
├─────────────────────────────────────────┤
│  [Print] [PDF] [WhatsApp]  [Close]     │
└─────────────────────────────────────────┘
```

