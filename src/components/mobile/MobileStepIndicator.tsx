import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description?: string;
}

interface MobileStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function MobileStepIndicator({ steps, currentStep, className }: MobileStepIndicatorProps) {
  return (
    <div className={cn('w-full py-4 px-4', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-secondary -z-10">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1"
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'border-2 transition-all duration-300',
                'bg-background',
                isCompleted && 'border-primary bg-primary text-primary-foreground',
                isCurrent && 'border-accent text-accent scale-110 shadow-md',
                isUpcoming && 'border-secondary text-muted-foreground'
              )}>
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              
              <div className="mt-2 text-center">
                <p className={cn(
                  'text-xs font-medium',
                  isCurrent && 'text-accent font-semibold',
                  isCompleted && 'text-primary',
                  isUpcoming && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}