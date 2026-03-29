# Supabase Migration Plan - BAB UL ILM School
## Read-Only Access Data Export Strategy

---

## Current Situation

**Source Database:**
- Project ID: `qzbdztoxqrifabnsvmgt`
- Access Level: READ-ONLY (anon key)
- Status: ⚠️ Credentials lost, no admin access

**Limitation:** Service role key unavailable = Cannot use pg_dump or official migration tools

---

## Migration Strategy: JSON Export + SQL Reconstruct

Since we only have read access, we'll export table-by-table as JSON, then reconstruct in new Supabase.

### Phase 1: Data Audit (15 min)
```
✓ Check which tables have data
✓ Identify data relationships (foreign keys)
✓ Calculate total data volume
```

### Phase 2: Export Tables (1-2 hours)
For each table with data:
1. Query all rows using `.select('*')`
2. Save as JSON file: `export/<table_name>.json`
3. Handle pagination if >1000 rows (default Supabase limit)

### Phase 3: Schema Reconstruction (2-3 hours)
In new Supabase project:
1. Create tables matching original schema
2. Set up relationships, triggers, functions
3. Enable RLS policies (basic setup)

### Phase 4: Data Import (1 hour)
1. Transform JSON to SQL INSERT statements
2. Import in dependency order (parents → children)
3. Verify foreign key constraints

---

## Table Export Priority Order

### 🔴 CRITICAL - Must Export First
Used for IDs in other tables:
1. **parents** - Parent records
2. **students** - Student records
3. **teachers** - Teacher records
4. **suppliers** - Supplier records
5. **account_categories** - Accounting categories
6. **collections** - Fee collections
7. **concession_categories** - Discount categories
8. **book_items** / **book_sets** - Book inventory
9. **classes** - Class definitions
10. **syllabus_types** - Syllabus definitions

### 🟡 TRANSACTIONAL - Export Second
Reference IDs from above:
11. **fee_payments** - Fee payment records
12. **parent_transactions** - Parent transactions
13. **account_transactions** - Account transactions
14. **book_sales** - Book sales
15. **book_sale_items** - Book sale items
16. **book_set_items** - Book set items
17. **balance_writeoffs** - Balance adjustments
18. **sibling_discounts** - Sibling fee discounts
19. **transaction_line_items** - Transaction details
20. **user_roles** - User role assignments

---

## Relationship Map (Foreign Keys)

```
parents
├── students (parent_id)
├── fee_payments (parent_id)
├── parent_transactions (parent_id)
├── book_sales (parent_id)
├── balance_writeoffs (parent_id)
└── transaction_line_items (via parent_transactions)

students
├── fee_payments (student_id)
├── book_sales (student_id)
├── balance_writeoffs (student_id)
└── transaction_line_items (via fee_payments)

teachers
└── (standalone, referenced by classes)

suppliers
├── supplier_transactions
└── (standalone)

account_categories
├── account_transactions (category_id)
└── (standalone)

collections
├── transaction_line_items (collection_id)
└── (standalone)
```

---

## Export Methodology

### Per-Table Export Script Template
```typescript
// For each table, run:
const { data, error } = await supabase
  .from('TABLE_NAME')
  .select('*');

if (data) {
  await Bun.write('export/TABLE_NAME.json', JSON.stringify(data, null, 2));
}
```

### Handling Large Tables (>1000 rows)
```typescript
// Paginated export for tables like fee_payments, account_transactions
let allData = [];
let page = 0;
const pageSize = 1000;

while (true) {
  const { data } = await supabase
    .from('table')
    .select('*')
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  if (!data || data.length === 0) break;
  allData = allData.concat(data);
  page++;
}
```

---

## New Supabase Setup Checklist

### Step 1: Create New Project
- [ ] Create new Supabase project
- [ ] Save service_role key securely
- [ ] Enable email auth
- [ ] Note new project URL and anon key

### Step 2: Enable Extensions
```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 3: Recreate Schema
Using types.ts + manual SQL reconstruction:
1. Create tables in dependency order
2. Add foreign key constraints
3. Create indexes
4. Set up triggers (if critical)

### Step 4: Import Data
1. Upload JSON files to new project
2. Transform to INSERT statements
3. Execute in correct order
4. Verify counts match

### Step 5: Configure RLS
```sql
-- Basic template for each table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON table_name
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Read-only = no functions/triggers | Medium | Export SQL for functions, recreate manually |
| Large tables may timeout | Low | Use pagination, export in chunks |
| UUID conflicts | Low | Keep original IDs, don't regenerate |
| Data corruption during transfer | Low | JSON backup + checksum verification |
| Missing auth users | High | Users must re-register in new project |

---

## File Structure Output

```
/supabase-export/
├── 00_data_audit.json          # Summary of what tables have data
├── 01_schema_reconstruction.sql # Create table statements
├── 02_parent_tables.json       # parents, students, teachers, etc.
├── 03_transaction_tables.json  # fee_payments, transactions, etc.
├── 04_import_script.sql        # Generated INSERT statements
└── 05_verification_report.md     # Row count comparisons
```

---

## Time Estimate

| Phase | Duration |
|-------|----------|
| Data Audit | 15 min |
| Export All Tables | 1-2 hours |
| Schema Reconstruction | 2-3 hours |
| Data Import & Verification | 1 hour |
| **Total** | **4-6 hours** |

---

## What YOU Need to Provide

1. **New Supabase project details:**
   - Project URL
   - Anon key
   - Service role key (for admin operations)

2. **Verification:**
   - Confirm all data is critical (or can any be left behind?)

3. **Post-migration:**
   - Update `.env.production` with new credentials
   - Re-deploy to Netlify

---

## Decision Point

**Options:**

**A)** Proceed with full migration (4-6 hours, complete data transfer)
**B)** Start fresh, export only critical reference data (1 hour, classes/syllabus/config only)
**C)** Keep current database working, just update app credentials (30 min, if access restored)

**Recommendation:** Option A if data is valuable, Option B if mainly testing.

---

Ready to proceed? Which option would you like?
