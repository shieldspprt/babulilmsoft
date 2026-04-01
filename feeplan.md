# Fee Module — Redesign Plan (v4 — Subscription Model)

## What Changed & Why

The old approach (v3) used a `fee_bills` table — one row per parent per month. It tried to "generate" bills in advance, which is wrong. **Netflix doesn't create 1 year of bills when you subscribe.** It just checks: are you subscribed? Yes → you owe this month.

Our system works the same way:
- **Is the child admitted before this month?** Yes → month is payable.
- **Has any payment touched this month?** Yes → month is paid/inactive.
- No pre-generated rows. No bill snapshots. Just admission date + payment history.

---

## Core Concept

### The Subscription Model

Think of it like Netflix:
1. A child gets admitted → subscription starts (from admission month)
2. Every month from admission → current month is "payable"
3. Parent can pay for 1 month or multiple months
4. Parent can pay LESS or MORE than the fee
5. Underpaid? Balance carries forward. Overpaid? Advance carries forward.
6. That's it.

### How Balance/Advance Works

| Scenario | Monthly Fee | Selected | Paid | Result |
|----------|------------|----------|------|--------|
| Exact pay | Rs 3,000 | March | Rs 3,000 | March: **Paid**. No balance. |
| Underpay | Rs 3,000 | March | Rs 2,500 | March: **Paid**. Balance **Rs 500** carries to April. |
| Overpay | Rs 3,000 | March | Rs 4,000 | March: **Paid**. Advance **Rs 500** carries to April. |
| Multi-month under | Rs 3,000 | Mar + Apr | Rs 5,000 | Both: **Paid**. Balance **Rs 1,000** carries to May. |
| Multi-month over | Rs 3,000 | Mar + Apr | Rs 7,000 | Both: **Paid**. Advance **Rs 1,000** carries to May. |
| With existing balance | Rs 3,000 | Apr (+500 bal) | Rs 4,000 | April: **Paid**. Balance **Rs -500** → Advance to May. |

**Key rule: The difference between (fee × months + previous balance) and amount paid becomes the new running balance.**

---

## Database Changes

### Step 1: Drop `fee_bills` table (not needed)

Run in Supabase SQL Editor:

```sql
-- Drop the fee_bills table entirely — we no longer pre-generate bills
DROP TABLE IF EXISTS public.fee_bills;
```

The `fee_payments` table stays as-is. It already stores everything we need:

```sql
-- This table is KEPT as-is
CREATE TABLE IF NOT EXISTS fee_payments (
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

### Why only one table?

- `fee_payments` stores the **transaction**: who paid, how much, for which months, when, how
- Everything else (which months are due, what's the balance) is **calculated at display time** from:
  - `students.date_of_admission` → determines payable months
  - `students.monthly_fee` → determines fee amount
  - `fee_payments` → determines what's been paid and what's the running balance

---

## Computation Logic (Pure JavaScript — No DB queries for state)

### When parent is selected, compute everything in-memory:

```javascript
// 1. Get inputs
monthlyFee = sum of all active children's monthly_fee
admissionMonth = earliest date_of_admission among children → "YYYY-MM"
currentMonth = today → "YYYY-MM"

// 2. Count payable months
payableMonths = all months from admissionMonth to currentMonth (inclusive)
totalPayable = payableMonths.length

// 3. From payment history
payments = all fee_payments for this parent (sorted by created_at ASC)
touchedMonths = new Set()  // union of all months_paid across all payments
for (payment of payments):
  for (month of payment.months_paid):
    touchedMonths.add(month)

totalPaid = sum of all payment.amount
totalOwed = totalPayable × monthlyFee
runningBalance = totalOwed - totalPaid
// positive = parent owes money (underpaid overall)
// negative = parent has advance (overpaid overall)
// zero = fully settled

// 4. Build month status for display
for (month of payableMonths):
  if (month in touchedMonths):
    status = 'paid'       // green, not selectable
  else:
    status = 'due'        // gray, selectable
```

### When recording a payment:

```javascript
// 1. User selects N months, enters amount X
// 2. Total due for selected months:
totalDue = N × monthlyFee + runningBalance
// Note: runningBalance is added because if parent had a previous balance,
// it gets absorbed into this payment

// 3. Insert into fee_payments:
insert {
  school_id, parent_id,
  amount: X,
  months_paid: selectedMonths,    // text array
  months_count: N,
  payment_date, payment_method, notes
}

// 4. New running balance (after refresh):
newBalance = totalDue - X
// positive = still owes (balance)
// negative = has advance
// zero = clean
```

### When deleting a payment:

```javascript
// 1. Delete the fee_payment row
delete from fee_payments where id = paymentId

// 2. Recalculate running balance from remaining payments
// Everything recomputes automatically — no cascading needed
```

**That's it.** No bill rows. No snapshots. No carry-forward columns. Just math.

---

## Display Logic — Month Grid

### What each month card shows:

For a parent with:
- Admission: June 2026
- Current month: April 2026 (wait — this doesn't make sense. Let me use a real example)
- Admission: January 2026
- Current month: April 2026
- Monthly fee: Rs 3,000
- Running balance: Rs 500 (underpaid overall)

```
┌──────────┬──────────┬──────────┬──────────┐
│  Jan 26  │  Feb 26  │  Mar 26  │  Apr 26  │
│ Rs 3,000 │ Rs 3,000 │ Rs 3,000 │ Rs 3,500 │ ← first unpaid month absorbs balance
│  ✓ Paid  │  ✓ Paid  │  ○ Due   │  ○ Due   │
└──────────┴──────────┴──────────┴──────────┘
```

- **Paid months**: green background, "✓ Paid" badge, not clickable
- **First unpaid month (with balance)**: shows `monthlyFee + |balance|` if balance > 0, or `monthlyFee - |advance|` if balance < 0
- **Other unpaid months**: shows normal `monthlyFee`
- **Months before admission**: not shown at all
- **Months after current**: not shown (no future billing)

### When months are selected, show payment summary (inline, below grid):

```
┌──────────────────────────────────────────────────┐
│  2 months selected                               │
│                                                   │
│  Fee for 2 months:         Rs 6,000              │
│  Previous balance:         Rs 500                │
│  ─────────────────────────────────────           │
│  Total Due:                Rs 6,500              │
│                                                   │
│  Amount Paying: [  ___________  ] Rs              │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │  ⚠ Rs 1,500 remaining (carries forward) │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  Method: [ Cash ▾ ]   Date: [ 2026-04-01 ]       │
│  Notes:  [ optional...              ]             │
│                                                   │
│  [ 📋 Record Payment ]                            │
└──────────────────────────────────────────────────┘
```

### Real-time calculation as user types:

| Amount Entered | Display |
|---------------|---------|
| Rs 6,500 | ✓ Exact amount — fully paid! |
| Rs 5,000 | ⚠ Rs 1,500 remaining (carries forward) |
| Rs 8,000 | ↻ Rs 1,500 advance (carries forward) |
| Rs 0 or empty | (no indicator) |

---

## Screen Layout

### Same two-panel layout (no visual change):

```
┌──────────────────────────────────────────────────────────┐
│  Fee Collection                                          │
├───────────────────┬──────────────────────────────────────┤
│  SEARCH PARENT    │  FEE DETAIL (selected parent)        │
│                   │                                      │
│  🔍 Search by     │  Ahmed Khan                          │
│  name, CNIC,      │  📞 0300-1234567                     │
│  or contact       │                                      │
│                   │  ── Children (2) ──────────────────  │
│  ┌─────────────┐  │  Ali    Class 5    Rs 2,000         │
│  │ Ahmed Khan  │  │  Sara   Class 3    Rs 1,000         │
│  │ 0300-123..  │  │  ─────────────────────────────────  │
│  │ 2 children  │  │  Monthly Fee Total: Rs 3,000        │
│  │ ● Rs 500    │  │                                      │
│  │   due       │  │  ── Fee Status ────────────────────  │
│  └─────────────┘  │                                      │
│  ┌─────────────┐  │  ┌──────┬──────┬──────┬──────┐      │
│  │ Fatima Bibi │  │  │ Jan  │ Feb  │ Mar  │ Apr  │      │
│  │ 0321-456..  │  │  │  ✓   │  ✓   │  ✓   │  ☐   │      │
│  │ 1 child     │  │  │ Paid │ Paid │ Paid │ Due  │      │
│  │ ○ All paid  │  │  │      │      │      │3,500 │      │
│  └─────────────┘  │  └──────┴──────┴──────┴──────┘      │
│                   │                                      │
│                   │  ── Payment Summary (when selected)  │
│                   │  Fee: 3,000 × 1 = 3,000             │
│                   │  Balance: +500                       │
│                   │  Total: 3,500                        │
│                   │  Amount: [ ____ ]                    │
│                   │  [ Record Payment ]                  │
│                   │                                      │
│                   │  ── Payment History ───────────────  │
│                   │  Jan 15  Cash  2 months  6,000  🗑️ │
│                   │  Dec 5   Jazz  1 month   2,500  🗑️ │
└───────────────────┴──────────────────────────────────────┘
```

### Parent card status indicators (left panel):

| Status | Dot Color | Label |
+|--------|-----------|-------|
+| Current month paid (balance = 0) | 🟢 Green | No label |
+| Has balance (owes money) | 🟠 Amber | "Rs 500 due" |
+| Has advance (overpaid) | 🔵 Blue | "Rs 500 advance" |
+| Current month unpaid | ⚪ Gray | No label |
+| No payments ever | ⚪ Gray | No label |
+
+### Parent header balance display (right panel):
+
+```
+┌──────────────────────────────────────────────────┐
+│  Ahmed Khan                          Rs 500 due  │
+│  📞 0300-1234567                   unpaid bal.  │
+└──────────────────────────────────────────────────┘
+```
+
+Or when advance:
+```
+┌──────────────────────────────────────────────────┐
+│  Ahmed Khan                        Rs 500 adv.  │
+│  📞 0300-1234567                     credit      │
+└──────────────────────────────────────────────────┘
+```
+
+---
+
+## Component Architecture
+
+### FeeManager.tsx — State
+
+```
+State:
+  parents[]                 — All parents + student counts + balance status
+  search                    — Search query
+  selectedParent            — Currently selected parent (null = empty state)
+  payments[]                — fee_payments for selected parent
+  children[]                — Active children + class info for selected parent
+  selectedMonths            — Set<'YYYY-MM'> clicked in grid
+  paymentAmount             — number (user-entered)
+  paymentForm               — { method, date, notes }
+  saving / deleting         — Loading states
+  mobileShowDetail          — Boolean (mobile: list vs detail)
+
+Derived (useMemo):
+  monthlyFee                — sum(children.monthly_fee)
+  admissionMonth            — min(children.date_of_admission).slice(0,7)
+  payableMonths             — all months from admissionMonth to currentMonth
+  touchedMonths             — Set of months appearing in any payment's months_paid
+  totalPaid                 — sum(payments.amount)
+  totalOwed                 — payableMonths.length × monthlyFee
+  runningBalance            — totalOwed - totalPaid
+  totalForSelected          — selectedMonths.size × monthlyFee + runningBalance
+  netBalance                — totalForSelected - paymentAmount
+
+Effects:
+  loadParents()             — Mount: parents + student counts + balance status
+  loadParentDetail()        — selectedParent change: payments + children
+  After save/delete         → reload detail
+
+Functions:
+  toggleMonth(month)        — Add/remove from selectedMonths
+  recordPayment()           — Validate → insert fee_payment → refresh
+  handleDeletePayment()     — Delete fee_payment → refresh
+```
+
+### Data flow:
+
+```
+User selects parent
+  → Fetch children (students table) + payments (fee_payments table)
+  → Compute: monthlyFee, admissionMonth, payableMonths, touchedMonths, balance
+  → Render month grid
+
+User clicks months + enters amount + clicks Record
+  → Insert 1 row into fee_payments
+  → Reload payments
+  → Recompute everything
+  → Update UI
+```
+
+### No bill generation. No bill updates. No bill snapshots. Just 1 insert per payment.
+
+---
+
+## Admission Date Rules
+
+### How admission date determines payable months:
+
+```
+Student A: date_of_admission = 2026-03-15 → admission month = "2026-03"
+Student B: date_of_admission = 2026-06-01 → admission month = "2026-06"
+
+Parent's admission month = min("2026-03", "2026-06") = "2026-03"
+
+Payable months (if today = 2026-04):
+  March 2026, April 2026
+
+Monthly fee = Student A fee + Student B fee = ALL children's current fee
+```
+
+**Important**: We use the EARLIEST admission date across all children. Monthly fee is always the CURRENT total (sum of all active children). This keeps it simple — no per-month fee calculations.
+
+**Future months are NOT shown.** Only from admission month up to current month.
+
+---
+
+## Payment History
+
+### What's shown:
+
+```
+┌─────────────────────────────────────────────────────┐
+│  Payment History                                     │
+│                                                      │
+│  ┌────────────────────────────────────────────────┐  │
+│  │  Apr 1, 2026    Mar 26       Rs 2,500  Cash  🗑️│  │
+│  │  Mar 15, 2026   Jan, Feb     Rs 6,000  Jazz  🗑️│  │
+│  │  Dec 5, 2025    Nov          Rs 3,000  Bank  🗑️│  │
+│  └────────────────────────────────────────────────┘  │
+└─────────────────────────────────────────────────────┘
+```
+
+Each row shows: date, months covered (short names), amount, method, delete button.
+
+---
+
+## Delete Payment Flow
+
+1. User clicks 🗑️ on a payment row
+2. Confirmation modal: "Delete payment of Rs X for [months]?"
+3. On confirm: delete the `fee_payments` row
+4. Reload payments → recompute balance → update UI
+5. All month statuses update automatically (a month that was "paid" may become "due" again)
+
+**No cascading issues.** Since we don't store per-month bills, deleting a payment just removes it from history and everything recalculates from scratch.
+
+---
+
+## Edge Cases
+
+| Scenario | Behavior |
+|----------|----------|
+| No active children | Children section empty. "No active children enrolled." message. Record payment disabled. |
+| Parent has no payments ever | All months show "Due". Running balance = totalOwed. |
+| All months paid (balance = 0) | All months green "Paid". No selectable months. "All up to date!" message. |
+| All months paid (balance < 0, advance) | All months green. Header shows advance amount. |
+| Payment amount = 0 | Record button disabled. |
+| No months selected | Payment summary not shown. Record button not visible. |
+| Student admitted this month | Only current month shown. |
+| Student admitted in future | Not possible (admission date should be <= today). |
+| Parent with children in different classes | All fees summed. One monthly total. |
+| Delete the only payment | All months revert to "Due". Balance recalculated. |
+| Multiple rapid payments | Each is independent. Balance recalculates from all. |
+| Same month paid twice (two payments both include March) | Allowed. March stays "paid". Both amounts count toward totalPaid. |
+
+---
+
+## SQL Migration (Run Once)
+
+```sql
+-- =====================================================
+-- FEE MODULE v4 — Migration
+-- Run this in Supabase SQL Editor
+-- =====================================================
+
+-- 1. Drop fee_bills table (no longer needed)
+DROP TABLE IF EXISTS public.fee_bills CASCADE;
+
+-- 2. fee_payments table stays as-is (already exists with correct schema + RLS)
+-- If it doesn't exist for some reason, create it:
+CREATE TABLE IF NOT EXISTS public.fee_payments (
+  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
+  school_id      uuid NOT NULL,
+  parent_id      uuid NOT NULL,
+  amount         integer NOT NULL CHECK (amount > 0),
+  months_paid    text[] NOT NULL,
+  months_count   integer NOT NULL,
+  payment_date   date NOT NULL DEFAULT CURRENT_DATE,
+  payment_method text NOT NULL DEFAULT 'Cash',
+  notes          text,
+  created_at     timestamptz DEFAULT now()
+);
+
+-- RLS (if not already set)
+ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
+
+CREATE POLICY "fee_payments_select" ON public.fee_payments FOR SELECT
+  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
+CREATE POLICY "fee_payments_insert" ON public.fee_payments FOR INSERT
+  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
+CREATE POLICY "fee_payments_delete" ON public.fee_payments FOR DELETE
+  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
+
+-- Index
+CREATE INDEX IF NOT EXISTS idx_fee_payments_parent
+  ON public.fee_payments(parent_id, created_at DESC);
+```
+
+---
+
+## Files to Change
+
+| File | Change |
+|------|--------|
+| `db/fee_module_v4.sql` | **NEW** — Migration script (drop fee_bills, ensure fee_payments) |
+| `src/components/FeeManager.tsx` | **REWRITE** — Remove all fee_bills logic. Pure subscription model. |
+| `src/components/FeeManager.css` | **MINOR** — Remove bill-specific styles, keep existing layout |
+| `src/pages/Dashboard.tsx` | **NO CHANGE** — Already wired up with Fee tab |
+
+---
+
+## What Gets Removed from FeeManager.tsx
+
+- `FeeBill` type — gone
+- `parseBill()` function — gone
+- `fee_bills` table queries (SELECT, INSERT, UPDATE, DELETE) — all gone
+- `generateBills()` — already removed but any remnants — gone
+- `bills` state variable — gone
+- `paidMonthsSet` derived from bills — replaced by `touchedMonths` from payments
+- `lastPaidBill` / `lastPaidBalance` — replaced by `runningBalance`
+- Bill allocation loop in `recordPayment()` — replaced by single fee_payments INSERT
+- Bill deletion in `handleDeletePayment()` — replaced by single fee_payments DELETE
+
+## What Gets Added to FeeManager.tsx
+
+- `touchedMonths` — Set<string> derived from all payments' months_paid arrays
+- `totalPaid` — sum of all payment amounts
+- `totalOwed` — payableMonths.length × monthlyFee
+- `runningBalance` — totalOwed - totalPaid
+- `getEffectiveFee(month)` — returns monthlyFee + balance for first unpaid month, monthlyFee for rest
+- Simplified `recordPayment()` — single INSERT into fee_payments
+- Simplified `handleDeletePayment()` — single DELETE from fee_payments
+- Parent balance computation for left panel cards
+
+---
+
+## Build & Deploy Steps
+
+1. **Run migration SQL** (`fee_module_v4.sql`) in Supabase SQL Editor
+2. **Rewrite `FeeManager.tsx`** with subscription model logic
+3. **Update `FeeManager.css`** (minor tweaks)
+4. **Test locally** — `npm run dev`
+5. **Build** — `npm run build`
+6. **Push to GitHub** — auto-deploys via Netlify
+
+---
+
