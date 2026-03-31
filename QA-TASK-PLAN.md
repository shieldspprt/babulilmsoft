# QA Task Execution Plan

## Status Board

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |
| P0-003 | Fix Teachers DB schema | P0 | Not Started |
| P1-001 | Add CNIC validation | P1 | Not Started |
| P1-002 | Fix delete error handling | P1 | Not Started |
| P1-003 | Fix credit race condition | P1 | Not Started |
| P1-004 | Add XSS protection | P1 | Not Started |
| P2-001 | Extract payment config | P2 | Not Started |
| P2-002 | Add search debounce | P2 | Not Started |

---









## 

---

### P0-003: Fix Teachers Database Schema

**Migration SQL:**

```sql
ALTER TABLE teachers ADD COLUMN type text DEFAULT 'Teacher';
UPDATE teachers SET type = 'Teacher' WHERE type IS NULL;
```

**Checklist:**

- [ ]  Add type column

- [ ]  Update all existing records

- [ ]  Verify TeachersManager works

---

## Phase 2: High Priority (P1) - Week 1-2

### P1-001: Add CNIC Validation

**Pattern:**

```typescript
const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;
const validateCnic = (cnic: string): boolean => CNIC_REGEX.test(cnic);
```

**Files:** ParentsManager.tsx, TeachersManager.tsx, StudentsManager.tsx

**Checklist:**

- [ ]  Add validation function

- [ ]  Apply in form submit handlers

- [ ]  Show error state visually

- [ ]  Test with valid/invalid CNICs

---

### P1-002: Fix Delete Error Handling

**Pattern for all managers:**

```typescript
const handleDelete = async () => {
  if (!deleteTarget) return;
  setDeleting(true);
  const { error } = await supabase.from('table').delete().eq('id', deleteTarget.id);
  setDeleting(false);

  if (error) {
    setFlash('Error: ' + error.message);
    setTimeout(() => setFlash(''), 4000);
    return;
  }

  setDeleteTarget(null);
  load();
};
```

---

### P1-003: Fix Credit Race Condition

**Current Issue:**

```typescript
// VULNERABLE: read then update
const { data } = await supabase.from('schools').select('total_credits')
await supabase.from('schools').update({ total_credits: data + newCredits })
```

**Fix:** Move credit update to database function (see full report)

---

## Phase 3: Medium Priority (P2) - Week 2-3

### P2-001: Extract Payment Configuration

- Create payment_settings table
- Make editable in AdminDashboard
- Load dynamically in Dashboard

### P2-002: Add Search Debounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

### P2-003: Fix Form Reset on Cancel

- Reset form state when modal closes
- Clear error messages

### P2-004: Add Keyboard Accessibility

- Escape key closes modals
- ARIA labels on inputs
- Focus trap in modals

### P2-005: Fix Parent Selector in StudentsManager

- Make parent field a working dropdown
- Load parents list for selection