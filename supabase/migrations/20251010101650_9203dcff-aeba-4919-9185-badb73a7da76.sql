-- Clean up all parent and student related data
-- Delete in correct order to avoid foreign key violations

-- 1. Delete transaction line items (references transactions)
DELETE FROM public.transaction_line_items;

-- 2. Delete parent transactions (references parents)
DELETE FROM public.parent_transactions;

-- 3. Delete balance writeoffs (references parents and students)
DELETE FROM public.balance_writeoffs;

-- 4. Delete collection payments (references parents and students)
DELETE FROM public.collection_payments;

-- 5. Delete fee payments (references parents and students)
DELETE FROM public.fee_payments;

-- 6. Delete student concessions (references students)
DELETE FROM public.student_concessions;

-- 7. Delete sibling discounts (references parents)
DELETE FROM public.sibling_discounts;

-- 8. Delete students (references parents)
DELETE FROM public.students;

-- 9. Delete parents (main table)
DELETE FROM public.parents;

-- Reset sequences for clean ID generation
ALTER SEQUENCE IF EXISTS public.parent_counter RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.student_counter RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.transaction_counter RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.receipt_counter RESTART WITH 1;