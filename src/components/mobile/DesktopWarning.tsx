import { useMobileDetect } from '@/hooks/useMobileDetect';
import { Monitor, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const DesktopWarning = () => {
  const { isDesktop } = useMobileDetect();
  const navigate = useNavigate();

  if (!isDesktop) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center space-y-6 border border-accent/20">
        <div className="flex justify-center">
          <img src={logo} alt="BAB UL ILM" className="h-16 w-16 rounded-lg shadow-md" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Mobile-Only Page</h1>
          <p className="text-muted-foreground">
            This page is optimized for mobile devices. Please access it from a mobile device or use the desktop version.
          </p>
          <p className="text-sm font-urdu text-muted-foreground leading-relaxed">
            یہ صفحہ موبائل آلات کے لیے ہے
          </p>
        </div>

        <div className="pt-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Desktop Dashboard
          </Button>
        </div>

        <div className="pt-4 border-t border-border text-sm text-muted-foreground">
          <p>To test mobile view:</p>
          <ul className="mt-2 space-y-1 text-left list-disc list-inside">
            <li>Open browser DevTools (F12)</li>
            <li>Toggle device toolbar (Ctrl+Shift+M)</li>
            <li>Select a mobile device</li>
            <li>Refresh the page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};