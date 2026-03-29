import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
  className?: string;
}

export function MobileHeader({ title, onBack, action, className }: MobileHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={cn(
      'sticky top-0 z-50',
      'bg-primary text-primary-foreground',
      'shadow-md',
      'pt-safe',
      'transition-all duration-200',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="touch-target touch-feedback hover:bg-primary-foreground/10 text-primary-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <h1 className="text-lg font-semibold truncate flex-1 text-center px-2 mobile-fade-in">
          {title}
        </h1>
        
        <div className="min-w-10 flex justify-end">
          {action}
        </div>
      </div>
      {/* Gold accent line */}
      <div className="h-0.5 bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
    </header>
  );
}