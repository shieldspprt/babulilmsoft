import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Coins, Package, Calendar, CheckCircle2, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';

const Billing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const packages = [
    { 
      id: 'pkg-1-month',
      name: '1 Month', 
      credits: 30, 
      price: 2000,
      description: '30 days of active service',
      features: ['Full system access', 'Priority support', 'Daily backups']
    },
    { 
      id: 'pkg-3-months',
      name: '3 Months', 
      credits: 90, 
      price: 5000,
      description: '90 days of active service',
      features: ['Full system access', 'Priority support', 'Daily backups', 'Discounted rate']
    },
  ];

  useEffect(() => {
    if (user) {
      loadCreditBalance();
    }
  }, [user]);

  const loadCreditBalance = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('id, credit_balance')
        .eq('owner_id', user?.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCredits(data.credit_balance || 0);
        setSchoolId(data.id);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
      toast.error('Failed to load credit balance');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: typeof packages[0]) => {
    if (!schoolId) {
      toast.error('School not found. Please setup your school settings first.');
      return;
    }

    try {
      setPurchasing(pkg.id);
      
      const { error } = await supabase.rpc('add_credits', {
        p_school_id: schoolId,
        p_amount: pkg.credits,
        p_type: 'purchase',
        p_amount_paid: pkg.price,
        p_description: `Purchase of ${pkg.name} package`,
        p_payment_method: 'bank_transfer', // Default placeholder until payment gateway integration
      });

      if (error) {
        throw error;
      }

      toast.success('Credit request submitted! It will be active once approved by administration.');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to submit credit request');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] mt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navigation />
      
      <div className="p-6 max-w-6xl mx-auto mt-20">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Billing & Credits</h1>
            <p className="text-muted-foreground mt-1">Manage your active service plan</p>
          </div>
        </div>
        
        <Card className="mb-8 border-t-4 border-t-emerald-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Coins className="h-6 w-6 text-emerald-600" />
              </div>
              Current Balance
            </CardTitle>
            <CardDescription>
              Your available credits representing days of active service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-emerald-600">
                {credits !== null ? credits : '---'}
              </span>
              <span className="text-xl text-muted-foreground font-medium">days remaining</span>
            </div>
            {credits !== null && credits <= 7 && (
              <p className="text-sm text-destructive mt-4 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                Your balance is running low! Please recharge soon to avoid service interruption.
              </p>
            )}
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Recharge Packages
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative flex flex-col hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
              {pkg.id === 'pkg-3-months' && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Best Value
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="text-base">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight">PKR {pkg.price.toLocaleString()}</span>
                </div>
                
                <div className="space-y-3 mb-6">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2">
                    <Calendar className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-bold text-foreground">Adds {pkg.credits} days to account</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50">
                <Button 
                  className="w-full h-12 text-base font-semibold" 
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing !== null}
                  variant={pkg.id === 'pkg-3-months' ? 'default' : 'outline'}
                >
                  {purchasing === pkg.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing Request...
                    </span>
                  ) : (
                    'Request Credits'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Billing;
