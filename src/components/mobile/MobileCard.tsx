import { ReactNode, CSSProperties } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  style?: CSSProperties;
}

export function MobileCard({ children, onClick, className, active = false, style }: MobileCardProps) {
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      style={style}
      className={cn(
        'p-4 transition-all duration-200',
        'shadow-sm hover:shadow-md',
        'mobile-card-enter',
        'border-l-3 border-l-accent/30',
        isClickable && [
          'cursor-pointer',
          'active:scale-[0.97]',
          'hover:shadow-lg hover:border-l-accent/60',
          'touch-feedback'
        ],
        active && 'ring-2 ring-primary bg-primary/5 shadow-md border-l-primary',
        className
      )}
    >
      {children}
    </Card>
  );
}