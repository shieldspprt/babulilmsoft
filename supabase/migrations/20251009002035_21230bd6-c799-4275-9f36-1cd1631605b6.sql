-- Update collections table to support multiple classes
-- Change class_name to an array to support multiple classes
ALTER TABLE public.collections 
DROP COLUMN class_name;

ALTER TABLE public.collections 
ADD COLUMN class_names text[];

-- Update is_class_specific logic - if class_names is null or empty, it applies to all classes
COMMENT ON COLUMN public.collections.class_names IS 'Array of class names this collection applies to. NULL or empty means all classes';

-- Add index for better query performance
CREATE INDEX idx_collections_class_names ON public.collections USING GIN(class_names);

-- Create a view to help track outstanding collections per student
CREATE OR REPLACE VIEW public.student_outstanding_collections AS
SELECT 
  s.id as student_id,
  s.name as student_name,
  s.class,
  s.parent_id,
  c.id as collection_id,
  c.name as collection_name,
  c.description,
  c.amount as suggested_amount,
  COALESCE(
    (SELECT SUM(cp.amount_paid) 
     FROM public.collection_payments cp 
     WHERE cp.collection_id = c.id 
     AND (cp.student_id = s.id OR cp.parent_id = s.parent_id)
    ), 0
  ) as amount_paid,
  CASE 
    WHEN c.amount IS NOT NULL THEN GREATEST(c.amount - COALESCE(
      (SELECT SUM(cp.amount_paid) 
       FROM public.collection_payments cp 
       WHERE cp.collection_id = c.id 
       AND (cp.student_id = s.id OR cp.parent_id = s.parent_id)
      ), 0
    ), 0)
    ELSE NULL
  END as outstanding_amount
FROM public.students s
CROSS JOIN public.collections c
WHERE c.is_active = true
  AND s.is_active = true
  AND (
    c.class_names IS NULL 
    OR c.class_names = '{}' 
    OR s.class = ANY(c.class_names)
  );