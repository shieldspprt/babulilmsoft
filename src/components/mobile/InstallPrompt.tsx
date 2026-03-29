import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has already dismissed the prompt
      const dismissed = localStorage.getItem('install-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-primary to-emerald text-primary-foreground rounded-lg shadow-xl p-4 flex items-center gap-3 border border-accent/30">
        <Download className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Install BAB UL ILM</p>
          <p className="text-xs opacity-90 font-urdu">ایپ انسٹال کریں</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="flex-shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Install
        </Button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-primary-foreground/10 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};