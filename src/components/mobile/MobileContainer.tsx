import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function MobileContainer({ children, className, noPadding = false }: MobileContainerProps) {
  return (
    <div className={cn(
      'min-h-screen-safe bg-background',
      'pt-safe pb-safe',
      'flex flex-col',
      'momentum-scroll',
      className
    )}>
      <div className={cn(
        'flex-1 flex flex-col',
        !noPadding && 'pb-20' // Space for bottom navigation
      )}>
        {children}
      </div>
    </div>
  );
}
