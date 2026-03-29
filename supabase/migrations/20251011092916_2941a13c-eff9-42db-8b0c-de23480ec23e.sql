
-- Delete all income entries
DELETE FROM account_transactions 
WHERE id IN (
  'a01220cb-fa1e-4370-a6b4-12404b115865',  -- Oct 11, Stationary, Rs. 3,490
  '666ba83b-19aa-4c38-a939-108e3763243e',  -- Oct 10, Canteen, Rs. 12,000
  'a67f56fb-54c3-4b3c-973b-f5462b976e65'   -- Oct 08, Stationary, Rs. 1,287
);
