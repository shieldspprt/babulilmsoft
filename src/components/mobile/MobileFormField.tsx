import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MobileFormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
}

export function MobileFormField({
  label,
  children,
  required = false,
  error,
  description,
  className
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-mobile-base font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div className="touch-target">
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
