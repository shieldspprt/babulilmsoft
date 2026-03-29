-- Clean database for production
-- Delete transaction-related data first (to respect foreign keys)
DELETE FROM public.transaction_line_items;
DELETE FROM public.collection_payments;
DELETE FROM public.fee_payments;
DELETE FROM public.balance_writeoffs;

-- Delete student-related data
DELETE FROM public.student_concessions;
DELETE FROM public.sibling_discounts;

-- Delete parent and supplier transactions
DELETE FROM public.parent_transactions;
DELETE FROM public.supplier_transactions;

-- Delete account transactions
DELETE FROM public.account_transactions;

-- Delete collections
DELETE FROM public.collections;

-- Delete core data
DELETE FROM public.students;
DELETE FROM public.parents;
DELETE FROM public.suppliers;

-- Reset sequence counters to start fresh
ALTER SEQUENCE public.student_counter RESTART WITH 1;
ALTER SEQUENCE public.parent_counter RESTART WITH 1;
ALTER SEQUENCE public.receipt_counter RESTART WITH 1;
ALTER SEQUENCE public.transaction_counter RESTART WITH 1;
ALTER SEQUENCE public.supplier_counter RESTART WITH 1;
ALTER SEQUENCE public.supplier_transaction_counter RESTART WITH 1;