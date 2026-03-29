-- Phase 1: User Roles System (Security Foundation)
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Phase 2: Core Tables

-- Concession Categories Table (pre-populated)
CREATE TABLE public.concession_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.concession_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage concession categories"
  ON public.concession_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Insert pre-defined categories
INSERT INTO public.concession_categories (name, description) VALUES
  ('Hifz-e-Quran', 'Discount for students memorizing Quran'),
  ('Orphans', 'Discount for orphaned children'),
  ('Teacher''s Children', 'Discount for children of teaching staff'),
  ('Imam''s Children', 'Discount for children of religious leaders'),
  ('Staff Concession', 'Discount for staff members'' children'),
  ('Needy Families', 'Discount for families in financial need'),
  ('Sibling Discount', 'Discount for multiple siblings'),
  ('Family Based', 'Family-specific discounts'),
  ('Location Based', 'Location-based discounts');

-- Classes Table (pre-populated with fee structure)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  monthly_fee DECIMAL(10, 2) NOT NULL,
  admission_fee DECIMAL(10, 2) DEFAULT 0,
  annual_charges DECIMAL(10, 2) DEFAULT 0,
  academic_year TEXT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage classes"
  ON public.classes FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Insert pre-defined classes
INSERT INTO public.classes (name, monthly_fee) VALUES
  ('Playgroup', 2000),
  ('Nursery', 2000),
  ('KG', 2000),
  ('Class 1', 2000),
  ('Class 2', 2000),
  ('Class 3', 2000),
  ('Class 4', 2500),
  ('Class 5', 2500),
  ('Class 6', 2500),
  ('Class 7', 2500),
  ('Class 8', 3000),
  ('Class 9', 3000),
  ('Class 10', 3000),
  ('Class 11', 5000),
  ('Class 12', 5000);

-- Parents Table with auto-generated IDs
CREATE SEQUENCE public.parent_counter START 1;

CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id TEXT UNIQUE NOT NULL,
  cnic TEXT UNIQUE NOT NULL CHECK (length(cnic) = 13),
  father_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_secondary TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage parents"
  ON public.parents FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Function to generate parent ID: P + 4-digit counter + year + initials
CREATE OR REPLACE FUNCTION public.generate_parent_id(father_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  year_suffix TEXT;
  initials TEXT;
  name_parts TEXT[];
BEGIN
  -- Get next counter value
  counter := nextval('public.parent_counter');
  
  -- Get last 2 digits of current year
  year_suffix := SUBSTRING(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT FROM 3 FOR 2);
  
  -- Extract initials (first letter of first and last name)
  name_parts := regexp_split_to_array(TRIM(father_name), '\s+');
  IF array_length(name_parts, 1) >= 2 THEN
    initials := UPPER(SUBSTRING(name_parts[1] FROM 1 FOR 1) || SUBSTRING(name_parts[array_length(name_parts, 1)] FROM 1 FOR 1));
  ELSE
    initials := UPPER(SUBSTRING(father_name FROM 1 FOR 2));
  END IF;
  
  -- Format: P + 4-digit counter + 2-digit year + 2-letter initials
  RETURN 'P' || LPAD(counter::TEXT, 4, '0') || year_suffix || initials;
END;
$$;

-- Students Table with auto-generated IDs
CREATE SEQUENCE public.student_counter START 1;

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  roll_number TEXT,
  date_of_birth DATE NOT NULL,
  date_of_admission DATE NOT NULL DEFAULT CURRENT_DATE,
  cnic TEXT CHECK (cnic IS NULL OR length(cnic) = 13),
  monthly_fee DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage students"
  ON public.students FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Function to generate student ID: S + 4-digit counter + year + initials
CREATE OR REPLACE FUNCTION public.generate_student_id(student_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Student Concessions Table (max 2 per student)
CREATE TABLE public.student_concessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.concession_categories(id) NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
  approved_by UUID REFERENCES auth.users(id),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_concessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage concessions"
  ON public.student_concessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Trigger to enforce max 2 concessions per student
CREATE OR REPLACE FUNCTION public.check_max_concessions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.student_concessions WHERE student_id = NEW.student_id) >= 2 THEN
    RAISE EXCEPTION 'A student cannot have more than 2 discount categories';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_max_concessions
  BEFORE INSERT ON public.student_concessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_concessions();

-- Sibling Discounts Table
CREATE TABLE public.sibling_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
  applies_to_child_number INTEGER NOT NULL CHECK (applies_to_child_number >= 2),
  approved_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sibling_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage sibling discounts"
  ON public.sibling_discounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Fee Payments Table
CREATE SEQUENCE public.receipt_counter START 1;

CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.parents(id) NOT NULL,
  student_id UUID REFERENCES public.students(id) NOT NULL,
  month TEXT NOT NULL,
  base_fee DECIMAL(10, 2) NOT NULL,
  individual_discount DECIMAL(10, 2) DEFAULT 0,
  sibling_discount DECIMAL(10, 2) DEFAULT 0,
  total_discount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer')),
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage payments"
  ON public.fee_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Function to calculate sibling discount suggestion
CREATE OR REPLACE FUNCTION public.calculate_sibling_discount(parent_uuid UUID, child_number INTEGER)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  discount DECIMAL;
BEGIN
  -- Check if there's a custom sibling discount for this parent
  SELECT discount_value INTO discount
  FROM public.sibling_discounts
  WHERE parent_id = parent_uuid 
    AND applies_to_child_number = child_number 
    AND is_active = true
  LIMIT 1;
  
  -- If no custom discount, return 0 (admin will set manually)
  RETURN COALESCE(discount, 0);
END;
$$;

-- Function to calculate net fee for a student
CREATE OR REPLACE FUNCTION public.get_net_fee(student_uuid UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  base_fee DECIMAL;
  individual_disc DECIMAL := 0;
  sibling_disc DECIMAL := 0;
  parent_uuid UUID;
  sibling_count INTEGER;
BEGIN
  -- Get student's monthly fee and parent
  SELECT monthly_fee, parent_id INTO base_fee, parent_uuid
  FROM public.students
  WHERE id = student_uuid;
  
  -- Calculate individual discounts
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
  
  -- Get sibling count and calculate discount
  SELECT COUNT(*) INTO sibling_count
  FROM public.students
  WHERE parent_id = parent_uuid AND is_active = true;
  
  IF sibling_count >= 2 THEN
    sibling_disc := calculate_sibling_discount(parent_uuid, sibling_count);
  END IF;
  
  RETURN GREATEST(base_fee - individual_disc - sibling_disc, 0);
END;
$$;