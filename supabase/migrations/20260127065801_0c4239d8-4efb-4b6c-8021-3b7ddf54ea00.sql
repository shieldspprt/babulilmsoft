-- Add stock tracking columns to book_sets
ALTER TABLE public.book_sets 
ADD COLUMN IF NOT EXISTS current_stock integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost numeric NOT NULL DEFAULT 0;

-- Add book_set_id column to book_stock_transactions for tracking set purchases
ALTER TABLE public.book_stock_transactions 
ADD COLUMN IF NOT EXISTS book_set_id uuid REFERENCES public.book_sets(id);

-- Make book_item_id nullable since we'll now track sets instead
ALTER TABLE public.book_stock_transactions 
ALTER COLUMN book_item_id DROP NOT NULL;

-- Create trigger function to update book_set stock on transactions
CREATE OR REPLACE FUNCTION public.update_book_set_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.book_set_id IS NOT NULL THEN
    IF NEW.transaction_type = 'purchase' THEN
      UPDATE public.book_sets 
      SET current_stock = current_stock + NEW.quantity,
          unit_cost = COALESCE(NEW.unit_cost, unit_cost)
      WHERE id = NEW.book_set_id;
    ELSIF NEW.transaction_type = 'sale' THEN
      UPDATE public.book_sets 
      SET current_stock = current_stock - NEW.quantity
      WHERE id = NEW.book_set_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
      UPDATE public.book_sets 
      SET current_stock = current_stock + NEW.quantity
      WHERE id = NEW.book_set_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for book set stock updates
DROP TRIGGER IF EXISTS trigger_update_book_set_stock ON public.book_stock_transactions;
CREATE TRIGGER trigger_update_book_set_stock
AFTER INSERT ON public.book_stock_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_book_set_stock();