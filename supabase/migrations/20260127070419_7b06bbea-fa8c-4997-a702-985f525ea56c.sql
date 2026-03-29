-- Make student_id and parent_id nullable for walk-in customers
ALTER TABLE public.book_sales 
ALTER COLUMN student_id DROP NOT NULL,
ALTER COLUMN parent_id DROP NOT NULL;