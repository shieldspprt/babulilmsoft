import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailInput, useCompleteEmail } from '@/components/ui/email-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { isMobile } = useMobileDetect();
  const navigate = useNavigate();
  
  // Get the complete email with default domain appended
  const completeEmail = useCompleteEmail(email);

  useEffect(() => {
    if (user) {
      // Redirect to appropriate dashboard based on device
      navigate(isMobile ? '/mobile/dashboard' : '/dashboard');
    }
  }, [user, isMobile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate and use the complete email
      authSchema.parse({ email: completeEmail, password });

      const { error } = await signIn(completeEmail, password);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        // Navigate immediately to avoid intermediate route flashes
        navigate((() => {
          const ua = navigator.userAgent.toLowerCase();
          const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
          const isSmallScreen = window.innerWidth < 768;
          return (isMobileUA || isSmallScreen) ? '/mobile/dashboard' : '/dashboard';
        })(), { replace: true });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md border-accent/20 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="BAB UL ILM" className="h-16 w-16 rounded-lg shadow-md" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">Staff Login</CardTitle>
            <CardDescription className="mt-1">
              Enter your credentials to access the system
            </CardDescription>
            <p className="text-sm font-urdu text-muted-foreground mt-2 leading-relaxed">
              باب العلم — رہبر ترقی و کمال
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <EmailInput
                id="email"
                value={email}
                onChange={setEmail}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <a 
                  href="/signup" 
                  className="text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  Start your free trial →
                </a>
              </p>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Get 100 free credits for 14 days
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;