-- Add number_of_books column to book_sets table
ALTER TABLE public.book_sets ADD COLUMN number_of_books integer NOT NULL DEFAULT 0;