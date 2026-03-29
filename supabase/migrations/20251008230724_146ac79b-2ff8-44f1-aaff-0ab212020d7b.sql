-- Fix security warnings: Set search_path for all functions

-- Fix generate_parent_id function
CREATE OR REPLACE FUNCTION public.generate_parent_id(father_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter INTEGER;
  year_suffix TEXT;
  initials TEXT;
  name_parts TEXT[];
BEGIN
  counter := nextval('public.parent_counter');
  year_suffix := SUBSTRING(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT FROM 3 FOR 2);
  
  name_parts := regexp_split_to_array(TRIM(father_name), '\s+');
  IF array_length(name_parts, 1) >= 2 THEN
    initials := UPPER(SUBSTRING(name_parts[1] FROM 1 FOR 1) || SUBSTRING(name_parts[array_length(name_parts, 1)] FROM 1 FOR 1));
  ELSE
    initials := UPPER(SUBSTRING(father_name FROM 1 FOR 2));
  END IF;
  
  RETURN 'P' || LPAD(counter::TEXT, 4, '0') || year_suffix || initials;
END;
$$;

-- Fix generate_student_id function
CREATE OR REPLACE FUNCTION public.generate_student_id(student_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter INTEGER;
  year_suffix TEXT;
  initials TEXT;
  name_parts TEXT[];
BEGIN
  counter := nextval('public.student_counter');
  year_suffix := SUBSTRING(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT FROM 3 FOR 2);
  
  name_parts := regexp_split_to_array(TRIM(student_name), '\s+');
  IF array_length(name_parts, 1) >= 2 THEN
    initials := UPPER(SUBSTRING(name_parts[1] FROM 1 FOR 1) || SUBSTRING(name_parts[array_length(name_parts, 1)] FROM 1 FOR 1));
  ELSE
    initials := UPPER(SUBSTRING(student_name FROM 1 FOR 2));
  END IF;
  
  RETURN 'S' || LPAD(counter::TEXT, 4, '0') || year_suffix || initials;
END;
$$;

-- Fix check_max_concessions function
CREATE OR REPLACE FUNCTION public.check_max_concessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.student_concessions WHERE student_id = NEW.student_id) >= 2 THEN
    RAISE EXCEPTION 'A student cannot have more than 2 discount categories';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix generate_receipt_number function
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter INTEGER;
  year TEXT;
BEGIN
  counter := nextval('public.receipt_counter');
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  RETURN 'R' || year || '-' || LPAD(counter::TEXT, 6, '0');
END;
$$;

-- Fix calculate_sibling_discount function
CREATE OR REPLACE FUNCTION public.calculate_sibling_discount(parent_uuid UUID, child_number INTEGER)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discount DECIMAL;
BEGIN
  SELECT discount_value INTO discount
  FROM public.sibling_discounts
  WHERE parent_id = parent_uuid 
    AND applies_to_child_number = child_number 
    AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(discount, 0);
END;
$$;

-- Fix get_net_fee function
CREATE OR REPLACE FUNCTION public.get_net_fee(student_uuid UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_fee DECIMAL;
  individual_disc DECIMAL := 0;
  sibling_disc DECIMAL := 0;
  parent_uuid UUID;
  sibling_count INTEGER;
BEGIN
  SELECT monthly_fee, parent_id INTO base_fee, parent_uuid
  FROM public.students
  WHERE id = student_uuid;
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN discount_type = 'percentage' THEN base_fee * (discount_value / 100)
      WHEN discount_type = 'fixed_amount' THEN discount_value
      ELSE 0
    END
  ), 0) INTO individual_disc
  FROM public.student_concessions
  WHERE student_id = student_uuid 
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE);
  
  SELECT COUNT(*) INTO sibling_count
  FROM public.students
  WHERE parent_id = parent_uuid AND is_active = true;
  
  IF sibling_count >= 2 THEN
    sibling_disc := calculate_sibling_discount(parent_uuid, sibling_count);
  END IF;
  
  RETURN GREATEST(base_fee - individual_disc - sibling_disc, 0);
END;
$$;