-- Create trigger function to update parent balance on writeoff
CREATE OR REPLACE FUNCTION public.update_parent_balance_on_writeoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reduce parent's current_balance by the writeoff amount
  UPDATE public.parents 
  SET current_balance = current_balance - NEW.writeoff_amount
  WHERE id = NEW.parent_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after insert on balance_writeoffs
CREATE TRIGGER trigger_update_parent_balance_on_writeoff
  AFTER INSERT ON public.balance_writeoffs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parent_balance_on_writeoff();