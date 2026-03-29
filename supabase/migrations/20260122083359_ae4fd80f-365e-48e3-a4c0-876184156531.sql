-- Add base_fee column to students table to track original fee before discounts
ALTER TABLE public.students 
ADD COLUMN base_fee numeric;

-- Update existing student with known base_fee (Muhammad Saad Aziz has base 2200, net 1500)
UPDATE public.students 
SET base_fee = 2200 
WHERE id = '43447327-08bf-411d-9e80-410bc28e9bf5';

-- For other students without discounts, set base_fee = monthly_fee
UPDATE public.students 
SET base_fee = monthly_fee 
WHERE base_fee IS NULL;