import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Share, Plus, Menu } from 'lucide-react';

interface InstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstallGuide = ({ open, onOpenChange }: InstallGuideProps) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto pb-safe">
        <SheetHeader>
          <SheetTitle className="text-foreground">Install BAB UL ILM App</SheetTitle>
          <SheetDescription>
            Add to your home screen for a better experience
          </SheetDescription>
          <p className="text-sm font-urdu text-muted-foreground leading-relaxed">
            بہتر تجربے کے لیے ہوم اسکرین میں شامل کریں
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isIOS && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground">On iPhone/iPad:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tap the Share button</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Share className="h-4 w-4" />
                      <span className="text-xs">in Safari toolbar</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Select "Add to Home Screen"</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Plus className="h-4 w-4" />
                      <span className="text-xs">Scroll down in the menu</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tap "Add"</p>
                    <p className="text-xs text-muted-foreground mt-1">The app will appear on your home screen</p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {isAndroid && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground">On Android:</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tap the Menu button</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Menu className="h-4 w-4" />
                      <span className="text-xs">Three dots in Chrome</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Select "Add to Home screen"</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Plus className="h-4 w-4" />
                      <span className="text-xs">or "Install app"</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Confirm installation</p>
                    <p className="text-xs text-muted-foreground mt-1">The app will open in full screen</p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {!isIOS && !isAndroid && (
            <div className="text-sm text-muted-foreground">
              <p>This app works best on mobile devices.</p>
              <p className="mt-2">To install on mobile:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Open this page on your phone</li>
                <li>Follow the installation instructions</li>
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              ✨ Once installed, the app will work faster and can be used offline
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Got it
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};