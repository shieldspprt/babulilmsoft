# Fee Module — Design Plan (v3)

## Overview

The Fee Module enables monthly tuition fee collection from parents. The collector searches a parent, sees their children's fees, and clicks **Record Payment**. A modal shows **7 months** (3 prior, current, 3 next) — the collector **selects which months to charge** and **enters any amount**. The payment distributes chronologically (oldest first). Any shortfall or surplus on the last month becomes a **balance that carries forward** to the next month.

### Real-World Examples

| Scenario | Months Selected | Total Fee | Amount Paid | Result |
|----------|----------------|-----------|-------------|--------|
| Full payment for 1 month | April | Rs 3,000 | Rs 3,000 | April: **paid** |
| Underpayment for 1 month | April | Rs 3,000 | Rs 2,000 | April: **Rs 1,000 balance** (carries to May) |
| Overpayment for 1 month | April | Rs 3,000 | Rs 5,000 | April: **Rs 2,000 advance** (carries to May as credit) |
| Partial for 2 months | April + May | Rs 6,000 | Rs 5,000 | April: paid. May: **Rs 1,000 balance** (carries to June) |
| Covers 2 months fully | April + May | Rs 6,000 | Rs 6,000 | April: paid. May: paid. |
| Underpay + advance | April + May | Rs 6,000 | Rs 4,000 | April: paid. May: **Rs 2,000 balance** |

---

## Data Model

### Existing Tables (Read-Only for this Module)

**`students`** — Per-student fee data:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | FK → schools |
| `parent_id` | uuid | FK → parents |
| `first_name` / `last_name` | text | Student name |
| `admission_class_id` | uuid | FK → classes |
| `monthly_fee` | integer | **Already discounted** final fee in PKR |
| `discount_type` | text | `null` / `'percentage'` / `'amount'` |
| `discount_value` | integer | Discount % or fixed amount |
| `active` | boolean | Only active students are billed |
| `date_of_admission` | date | **Fee starts from this month** — student is excluded from bills before this date |

> `monthly_fee` already stores the **post-discount** amount (set at enrollment via `getFinalFee()`). The bill just sums it.

**`parents`** — Parent lookup (searchable by name, CNIC, contact).
**`classes`** — Class names and `monthly_fee` (pre-discount).

---

### New Table 1: `fee_bills`

One record per parent per month. Auto-generated when first viewed.

```sql
CREATE TABLE fee_bills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid NOT NULL,
  parent_id       uuid NOT NULL,
  billing_month   text NOT NULL,                -- 'YYYY-MM'

  -- Snapshot of children at generation time
  children_data   jsonb NOT NULL DEFAULT '[]',
  total_fee       integer NOT NULL DEFAULT 0,   -- Sum of children's monthly_fee

  -- Carry-forward from previous month
  carried_forward integer NOT NULL DEFAULT 0,    -- + = owed from last month, - = advance from last month

  -- Running totals (updated on each payment)
  amount_paid     integer NOT NULL DEFAULT 0,    -- Sum of payments against this bill
  balance         integer NOT NULL DEFAULT 0,    -- total_fee + carried_forward - amount_paid

  -- Status
  status          text NOT NULL DEFAULT 'pending', -- 'pending' | 'partial' | 'paid' | 'overpaid'

  -- Metadata
  payment_id      uuid,                          -- FK to fee_payments (the payment that last touched this bill)
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE(school_id, parent_id, billing_month)
);
```

**`children_data` JSONB structure:**
```json
[
  {
    "student_id": "uuid",
    "name": "Ahmed Khan",
    "class_name": "Class 5",
    "date_of_admission": "2026-06-15",
    "original_fee": 3000,
    "discount_type": "percentage",
    "discount_value": 10,
    "monthly_fee": 2700
  }
]
```

---

### New Table 2: `fee_payments`

One record per payment transaction. Links to multiple bills.

```sql
CREATE TABLE fee_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      uuid NOT NULL,
  parent_id      uuid NOT NULL,

  amount         integer NOT NULL CHECK (amount > 0),  -- Total PKR received
  months_paid    text[] NOT NULL,                       -- ['2026-03', '2026-04']
  months_count   integer NOT NULL,                      -- len(months_paid)

  payment_date   date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'Cash',
  notes          text,

  created_at     timestamptz DEFAULT now()
);
```

---

### RLS + Indexes

```sql
ALTER TABLE fee_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_all_own_fee_bills" ON fee_bills
  FOR ALL USING (school_id = (SELECT id FROM schools WHERE id = auth.uid()));

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_all_own_fee_payments" ON fee_payments
  FOR ALL USING (school_id = (SELECT id FROM schools WHERE id = auth.uid()));

CREATE INDEX idx_fee_bills_parent       ON fee_bills(parent_id, billing_month);
CREATE INDEX idx_fee_bills_parent_status ON fee_bills(parent_id, status);
CREATE INDEX idx_fee_payments_parent    ON fee_payments(parent_id, created_at DESC);
```

---

## Business Logic

### Bill Generation (Auto, Lazy)

When a parent's fee detail is viewed:

1. **Fetch** all existing bills for this parent.
2. **For months that lack a bill** (and parent has active children), auto-generate:
   - Fetch all `active` students where `date_of_admission <= last day of billing month` (see [Admission Month Rule](#admission-month-rule)).
   - Build `children_data` JSONB with snapshots.
   - `total_fee` = sum of students' `monthly_fee` (post-discount).

#### Admission Month Rule

A student's fee **starts from their admission month**. When generating a bill for any month `YYYY-MM`, only students who were admitted **on or before the last day of that month** are included.

```
billing_month = '2026-06'
  → include students where date_of_admission <= '2026-06-30'

billing_month = '2026-04'
  → include students where date_of_admission <= '2026-04-30'
  → student admitted 2026-06-15 is EXCLUDED from April bill
```

This means:
- A student admitted in **June 2026** will NOT appear in Jan–May bills.
- They WILL appear in June bill and onwards.
- If a parent's only child was admitted in June, Jan–May bills will have `total_fee = 0`.
- Bills auto-generated at different times may have different children (because admissions happen mid-year). This is **by design** — each month's bill reflects who was enrolled at that point.
3. **Compute `carried_forward`**: Look at the previous month's bill (chronologically):
   - If previous bill exists and `balance > 0` → `carried_forward = balance` (parent still owes)
   - If previous bill exists and `balance < 0` → `carried_forward = balance` (parent has advance)
   - If no previous bill or `balance = 0` → `carried_forward = 0`
4. `balance` = `total_fee + carried_forward` (initially, before any payment).
5. `status` = `'pending'`.
6. **Return** all bills.

> `carried_forward` is a **snapshot** — computed once at generation time from the previous month's state at that moment. If a previous month's payment is later deleted, the carry-forward won't auto-cascade. The bill can be deleted and re-viewed to regenerate.

---

### The 7-Month Payment Window

When the user clicks **"Record Payment"**, a modal shows **7 months**:

| Position | Example (today = Apr 2026) | Shown As |
|----------|---------------------------|----------|
| -3 | January 2026 | ☑ Paid (disabled) or ☐ Unpaid |
| -2 | February 2026 | ☑ Paid (disabled) or ☐ Unpaid |
| -1 | March 2026 | ☑ Paid (disabled) or ☐ Unpaid |
| **0** | **April 2026** | ☑ Paid (disabled) or ☐ Unpaid |
| +1 | May 2026 | ☑ Paid (disabled) or ☐ Unpaid |
| +2 | June 2026 | ☑ Paid (disabled) or ☐ Unpaid |
| +3 | July 2026 | ☑ Paid (disabled) or ☐ Unpaid |

**Rules:**
- **Months with a payment** (any status except `pending`): shown checked + disabled with a ✓ badge.
- **Months with no payment** (`status = 'pending'`): shown unchecked and selectable.
- **Months with Rs 0 fee**: not selectable (no children enrolled at that time).

---

### Payment Distribution Algorithm

When the user selects months, enters an amount, and clicks submit:

```
1. Sort selected months chronologically (oldest first)
2. Generate bills for any selected month that doesn't have one
3. remaining = payment_amount

4. For each month (oldest first):
   bill_total = total_fee + carried_forward

   if remaining >= bill_total:
     → Fully pay this month
     → amount_paid = bill_total
     → balance = 0
     → status = 'paid'
     → remaining -= bill_total

   else:
     → Partially pay this month (or overpay if remaining > bill_total from carried_forward)
     → amount_paid = amount_paid + remaining   (add to any previous payment on this bill)
     → balance = bill_total - amount_paid
     → if balance > 0: status = 'partial'
     → if balance = 0: status = 'paid'
     → if balance < 0: status = 'overpaid'
     → remaining = 0
     → BREAK (stop distributing)

5. if remaining > 0 after all months:
   → Last month gets the surplus
   → amount_paid += remaining
   → balance = bill_total - amount_paid  (will be negative)
   → status = 'overpaid'

6. Insert one fee_payments record with:
   amount = original payment_amount entered by user
   months_paid = all selected months (regardless of distribution)
   months_count = count

7. Update each bill's payment_id to the new payment
```

#### Walkthrough Examples

**Example A: Underpay 1 month**
- Select: April. Total fee: Rs 3,000. Carried forward: Rs 0. Amount paid: Rs 2,000.
- April: `amount_paid = 2,000`, `balance = 3,000 + 0 - 2,000 = 1,000`, `status = 'partial'`
- Rs 1,000 balance carries forward to May.

**Example B: Overpay 1 month**
- Select: April. Total fee: Rs 3,000. Carried forward: Rs 0. Amount paid: Rs 5,000.
- April: `amount_paid = 5,000`, `balance = 3,000 + 0 - 5,000 = -2,000`, `status = 'overpaid'`
- Rs 2,000 advance carries forward to May (as -2,000).

**Example C: Partial for 2 months**
- Select: April + May. April fee: Rs 3,000 (cf: 0). May fee: Rs 3,000 (cf: 0). Paid: Rs 5,000.
- April: `remaining 5,000 >= 3,000` → paid. `remaining = 2,000`.
- May: `remaining 2,000 < 3,000` → `amount_paid = 2,000`, `balance = 1,000`, `status = 'partial'`.
- Rs 1,000 balance carries forward to June.

**Example D: Covers 2 months exactly**
- Select: April + May. Fees: Rs 3,000 each (cf: 0). Paid: Rs 6,000.
- April: paid. `remaining = 3,000`.
- May: `remaining 3,000 >= 3,000` → paid. `remaining = 0`.
- Both months `status = 'paid'`.

**Example E: With carried forward**
- April had Rs 1,000 unpaid (from Example A). Now paying May.
- May bill was generated with `carried_forward = 1,000` (from April's balance).
- May total due: `total_fee 3,000 + carried_forward 1,000 = 4,000`.
- Select: May. Paid: Rs 4,000 → fully paid.
- Select: May. Paid: Rs 3,000 → `balance = 1,000` (still partial, carries to June).
- Select: May. Paid: Rs 5,000 → `balance = -1,000` (overpaid, advance carries to June).

---

### Deleting a Payment

1. Find all bills where `payment_id` = this payment's id.
2. For each bill:
   - Subtract `amount_paid` from this payment's distributed amount.
   - Recalculate `balance = total_fee + carried_forward - remaining_amount_paid`.
   - Update status accordingly.
   - Set `payment_id = null` if no other payment is linked.
3. Delete the `fee_payments` record.
4. Refresh UI.

> **Note on carry-forward cascade**: Deleting a payment may change a month's balance, which was used as `carried_forward` for the next month. The cascade doesn't auto-update. The school admin can delete the downstream bill and re-view it to regenerate with corrected carry-forward.

---

### Status Transitions

| Status | Condition |
|---|---|
| `pending` | `amount_paid = 0` and `carried_forward = 0` |
| `partial` | `balance > 0` (still owes money) |
| `paid` | `balance = 0` (fully settled) |
| `overpaid` | `balance < 0` (advance credit) |

> Once a bill has been touched by any payment (status is not `pending`), it appears as "paid" in the 7-month window and cannot be selected again. The balance (positive or negative) carries forward.

---

## UI Design

### Navigation

```
MAIN
  Overview
  Classes
  Teachers
  Parents
  Students
  ──────────────
  Fees              ← NEW (icon: Receipt)
  ──────────────
  Income
  Expenses
  Suppliers
ACCOUNT
  Buy Credits
  Payment History
```

---

### Screen Layout — Two-Panel

```
┌──────────────────────────────────────────────────────────┐
│  Fee Collection                                          │
├───────────────────┬──────────────────────────────────────┤
│  SEARCH PARENT    │  FEE DETAIL (selected parent)        │
│                   │                                      │
│  🔍 Search by     │  Ahmed Khan                          │
│  name, CNIC,      │  📞 0300-1234567  🪪 35201-XXX..   │
│  or contact       │                                      │
│                   │  ── Children (3) ──────────────────  │
│  ┌─────────────┐  │  Ali    Class 5   3,000 → 2,700 10% │
│  │ Ahmed Khan  │  │  Sara   Class 3   2,000            │
│  │ 0300-123..  │  │  Omar   Class 3   2,000            │
│  │ 3 children  │  │  ─────────────────────────────────  │
│  │ ● All Paid  │  │  Monthly Fee Total: Rs 6,700        │
│  └─────────────┘  │                                      │
│  ┌─────────────┐  │  ── Month Status ──────────────────  │
│  │ Fatima Bibi │  │                                      │
│  │ 0321-456..  │  │  ┌──────┬──────┬──────┬──────┐      │
│  │ 2 children  │  │  │ Jan  │ Feb  │ Mar  │ Apr  │      │
│  │ ● Rs 1,000  │  │  │  ✓   │  ✓   │  ✓   │  ☐   │      │
│  │   due       │  │  │ Paid │ Paid │ Paid │ Due  │      │
│  └─────────────┘  │  │      │      │      │6,700 │      │
│  ┌─────────────┐  │  └──────┴──────┴──────┴──────┘      │
│  │ Usman Ali   │  │  ┌──────┬──────┬──────┐             │
│  │ 0333-789..  │  │  │ May  │ Jun  │ Jul  │             │
│  │ 1 child     │  │  │  ☐   │  ☐   │  ☐   │             │
│  │ ○ Unpaid    │  │  │6,700 │  —   │  —   │             │
│  └─────────────┘  │  └──────┴──────┴──────┘             │
│                   │                                      │
│                   │  ── Payment History ───────────────  │
│                   │  Mar 10  Cash    3 months  19,500  🗑️│
│                   │  Dec  5  Jazz    2 months  13,400  🗑️│
│                   │                                      │
│                   │  [  Record Payment  ]                │
└───────────────────┴──────────────────────────────────────┘
```

---

### Left Panel — Parent Cards

Each card shows:
- Parent name + contact (truncated)
- Children count badge
- Status indicator:
  - 🟢 **Green dot** — current month is paid (or overpaid)
  - 🟠 **Amber dot** — current month is partial
  - ⚪ **Gray dot** — current month is pending
- Outstanding balance: "Rs 1,000 due" or "Rs 2,000 advance" or nothing if fully paid

---

### Right Panel — Month Status Grid

Shows all **12 months of current year** as a grid:

```
  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
  │  Jan    │ │  Feb    │ │  Mar    │ │  Apr    │
  │ Rs 6,500│ │ Rs 6,500│ │ Rs 6,500│ │ Rs 6,700│
  │  ✓ Paid │ │  ✓ Paid │ │  ✓ Paid │ │  ☐ Due  │
  └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

Each month card shows:
- **Month name** + **fee amount**
- **Status icon** + label:
  - ✓ Paid (green bg)
  - ● Partial: Rs 1,000 due (amber bg)
  - ○ Due (gray bg)
  - ↻ Advance: Rs 2,000 (blue bg)
  - — (blank, no bill yet / future)

---

### Payment Modal

```
┌────────────────────────────────────────────────────────┐
│  Record Payment — Ahmed Khan                      [✕]  │
│                                                        │
│  Select months and enter amount:                       │
│                                                        │
│  ☑  January 2026     Rs 6,500   ✓ Paid               │  ← disabled
│  ☑  February 2026    Rs 6,500   ✓ Paid               │  ← disabled
│  ☑  March 2026       Rs 6,500   ✓ Paid               │  ← disabled
│  ☐  April 2026       Rs 6,700   ☐ Due                │  ← selectable
│  ☐  May 2026         Rs 6,700   ☐ Due                │  ← selectable
│  ☐  June 2026        Rs 6,700                        │  ← selectable
│  ☐  July 2026        Rs 6,700                        │  ← selectable
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Months selected: 2     Total due: Rs 13,400    │  │
│  │  (April has Rs 0 carry-forward)                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Amount Received (Rs):  [  5000  ]                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Rs 5,000 of Rs 13,400                           │  │
│  │  After payment: Rs 8,400 remaining (carries fwd) │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Payment Method:  [ Cash             ▾ ]               │
│  Payment Date:    [ 2026-04-01         ]               │
│  Notes:            [ optional...        ]               │
│                                                        │
│                    [ Cancel ]  [ Record Payment ]       │
└────────────────────────────────────────────────────────┘
```

**Key behaviors:**
1. **Month checkboxes**: 7 months shown. Paid months disabled. Unpaid months selectable.
2. **Real-time summary**: As months are checked/unchecked and amount is typed:
   - "Total due: Rs X" (sum of selected months' `total_fee + carried_forward`)
   - "After payment: Rs Y remaining (carries fwd)" — if underpaid
   - "After payment: Rs Y advance" — if overpaid
   - "After payment: Fully paid!" — if exact
3. **Amount input**: Free-form number. Not locked to total. User can enter more or less.
4. **Validation**: At least 1 month selected. Amount > 0.
5. **Submit**: Records payment, distributes chronologically, updates bills.

---

### Month Grid Detail (expanded view for a month)

When clicking a month in the grid (or on the detail panel), show the bill breakdown for that month:

```
  ── April 2026 ──────────────────────

  Children:
  Ali Khan    Class 5    Rs 2,700 (was 3,000, 10% off)
  Sara Khan   Class 3    Rs 2,000
  Omar Khan   Class 3    Rs 2,000
  ─────────────────────────────
  Monthly Fee:         Rs 6,700
  + Carry Forward:      Rs 1,000  (from March)
  ─────────────────────────────
  Total Due:            Rs 7,700
  - Paid:               Rs 3,000
  ─────────────────────────────
  Balance:              Rs 4,700  (unpaid)

  Payment: Apr 5, Cash, Rs 3,000  [Delete]
```

> This view appears in the right panel when a month card is clicked. A "← Back" returns to the full year grid view.

---

## File Structure

### New Files
```
src/components/FeeManager.tsx
src/components/FeeManager.css
db/fee_module.sql              ← Run manually on Supabase
```

### Modified Files
```
src/pages/Dashboard.tsx        ← Add 'fees' tab + nav item
```

---

## Dashboard.tsx Changes

```tsx
// Add to Tab type:
type Tab = 'overview' | 'classes' | 'teachers' | 'parents' | 'students'
         | 'fees' | 'income' | 'expense' | 'suppliers' | 'buy' | 'history';

// Add imports:
import { FeeManager } from '../components/FeeManager';
import { Receipt } from 'lucide-react';

// Add to NAV array (between students and income):
{ id: 'fees', label: 'Fees', icon: Receipt },

// Add to PAGE_TITLES:
fees: 'Fee Collection',

// Add to content section:
{tab === 'fees' && <FeeManager schoolId={profile.id} />}
```

---

## Component Architecture

```
FeeManager
├── State
│   ├── parents[]              — All parents + student counts + bill status
│   ├── search                 — Search query
│   ├── selectedParent         — Currently selected parent (null = empty state)
│   ├── bills[]                — fee_bills for selected parent (all months, all years)
│   ├── payments[]             — fee_payments for selected parent
│   ├── children[]             — Active children + class info for selected parent
│   ├── showPaymentModal       — Boolean
│   ├── selectedMonths         — Set<'YYYY-MM'> checked in modal
│   ├── paymentAmount          — number (user-entered)
│   ├── paymentForm            — { method, date, notes }
│   ├── focusedMonth           — 'YYYY-MM' | null (when viewing a specific month's detail)
│   ├── saving / deleting      — Loading states
│   └── mobileShowDetail       — Boolean (mobile: list vs detail)
│
├── Derived (useMemo)
│   ├── monthWindow(7)         — 7 months: 3 prior, current, 3 next
│   ├── totalForSelected       — Sum of (total_fee + carried_forward) for selected months
│   ├── netBalance             — totalForSelected - paymentAmount
│   └── currentMonthlyFee      — Sum of children's monthly_fee
│
├── Effects
│   ├── loadParents()          — Mount: parents + student counts + current month bill status
│   ├── loadParentDetail()     — selectedParent change: bills, payments, children
│   ├── ensureBillsForWindow() — Ensure bills exist for 7-month window
│   └── After save/delete      → reload detail
│
├── Functions
│   ├── generateBill(month)    — Create bill with children snapshot (filtered by admission date) + carry-forward
│   ├── handleRecordPayment()  — Validate → distribute → insert payment → update bills
│   ├── handleDeletePayment()  — Revert bills → delete payment
│   ├── distributePayment()    — Core algorithm: oldest first, track remaining
│   └── toggleMonth(month)     — Add/remove from selectedMonths
│
└── Render
    ├── Left Panel (parent list + search)
    │
    └── Right Panel
        ├── If focusedMonth → show single month bill detail
        │   ├── Children breakdown
        │   ├── Fee summary (total + cf - paid = balance)
        │   └── Payment records for this month
        │
        ├── Else → show year overview
        │   ├── Parent info header
        │   ├── Children breakdown table (current)
        │   ├── 12-month status grid
        │   ├── Payment history list
        │   └── [Record Payment] button
        │
        └── Payment Modal
            ├── 7-month checkboxes
            ├── Real-time summary (total, remaining, status)
            ├── Amount input
            ├── Method, date, notes
            └── Cancel / Submit
```

---

## Responsive Design

| Breakpoint | Layout |
|---|---|
| Desktop (>768px) | Two-panel side by side (left 300px, right flex) |
| Mobile (≤768px) | Single panel with ← Back navigation |

---

## Full SQL (`db/fee_module.sql`)

```sql
-- =====================================================
-- FEE MODULE — Tables, RLS, Indexes
-- =====================================================

-- 1. fee_bills
CREATE TABLE IF NOT EXISTS fee_bills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid NOT NULL,
  parent_id       uuid NOT NULL,
  billing_month   text NOT NULL,
  children_data   jsonb NOT NULL DEFAULT '[]',
  total_fee       integer NOT NULL DEFAULT 0,
  carried_forward integer NOT NULL DEFAULT 0,
  amount_paid     integer NOT NULL DEFAULT 0,
  balance         integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending',
  payment_id      uuid,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(school_id, parent_id, billing_month)
);

ALTER TABLE fee_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_all_own_fee_bills" ON fee_bills
  FOR ALL USING (school_id = (SELECT id FROM schools WHERE id = auth.uid()));

CREATE INDEX idx_fee_bills_parent       ON fee_bills(parent_id, billing_month);
CREATE INDEX idx_fee_bills_parent_status ON fee_bills(parent_id, status);

-- 2. fee_payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      uuid NOT NULL,
  parent_id      uuid NOT NULL,
  amount         integer NOT NULL CHECK (amount > 0),
  months_paid    text[] NOT NULL,
  months_count   integer NOT NULL,
  payment_date   date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'Cash',
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_all_own_fee_payments" ON fee_payments
  FOR ALL USING (school_id = (SELECT id FROM schools WHERE id = auth.uid()));

CREATE INDEX idx_fee_payments_parent ON fee_payments(parent_id, created_at DESC);
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No active children | Children section empty. All months show Rs 0. Record Payment disabled. |
| Student added after bill generated | Old bill keeps snapshot. New month bills include new student. |
| Student deactivated after bill | Same — snapshot frozen. |
| Carry-forward cascade after payment delete | Not automatic. Admin can delete downstream bill + re-view to regenerate. |
| Payment amount = 0 | Submit disabled. |
| All 7 months already paid | Modal shows all disabled. "All up to date" message. |
| Select months with no bills yet | Bills auto-generated with current children before payment distributes. |
| Rs 0 fee month (no children at that time) | Not selectable in modal. |
| Same month billed twice | Prevented by UNIQUE constraint. |
| Student admitted mid-year | Only billed from their admission month onwards. Jan–May bills for a June admission will have Rs 0 (or won't include this student). |
| Parent with children admitted in different months | Each month's bill only includes students who were admitted by that month. So Jan bill may have 2 children, June bill may have 3 (new admission). |

---

## Build Steps

1. **SQL** — Run `fee_module.sql` on Supabase
2. **FeeManager.css** — Two-panel layout, month grid, payment modal styles
3. **FeeManager.tsx** — Full component: parent list, detail, modal, distribution logic
4. **Dashboard.tsx** — Wire `fees` tab
5. **Build & verify** — `npm run build`
6. **Push to GitHub**
