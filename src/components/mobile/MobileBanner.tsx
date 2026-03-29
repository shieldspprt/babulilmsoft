import { useMobileDetect } from '@/hooks/useMobileDetect';
import { Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export const MobileBanner = () => {
  const { isMobile } = useMobileDetect();
  const navigate = useNavigate();

  if (!isMobile) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-accent/30">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full shrink-0">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Mobile Experience Available</h3>
          <p className="text-xs text-muted-foreground">
            Get a touch-optimized interface designed for mobile devices
          </p>
          <Button 
            onClick={() => navigate('/mobile/dashboard')}
            size="sm"
            className="w-full"
          >
            Switch to Mobile View
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};