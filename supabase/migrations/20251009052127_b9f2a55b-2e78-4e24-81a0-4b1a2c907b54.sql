-- Add employee_type column to teachers table
ALTER TABLE public.teachers 
ADD COLUMN employee_type text NOT NULL DEFAULT 'teacher' CHECK (employee_type IN ('teacher', 'staff'));

-- Add comment for clarity
COMMENT ON COLUMN public.teachers.employee_type IS 'Type of employee: teacher or staff';