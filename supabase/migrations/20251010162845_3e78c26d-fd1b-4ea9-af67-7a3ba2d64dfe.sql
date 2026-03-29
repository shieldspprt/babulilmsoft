-- Create class_type enum
CREATE TYPE class_type AS ENUM ('regular', 'passout');

-- Add class_type column to classes table
ALTER TABLE classes 
ADD COLUMN class_type class_type NOT NULL DEFAULT 'regular';

-- Add index for better query performance
CREATE INDEX idx_classes_type ON classes(class_type);

-- Add comment for documentation
COMMENT ON COLUMN classes.class_type IS 'Type of class: regular for standard classes, passout for exam/transition period classes';