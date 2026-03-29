import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { MobileContainer } from '@/components/mobile/MobileContainer';
import { MobileNav } from '@/components/mobile/MobileNav';
import { DesktopWarning } from '@/components/mobile/DesktopWarning';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp,
  LogOut,
  HelpCircle,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { InstallPrompt } from '@/components/mobile/InstallPrompt';
import { NetworkStatus } from '@/components/mobile/NetworkStatus';
import { InstallGuide } from '@/components/mobile/InstallGuide';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import logo from '@/assets/logo.png';

const MobileDashboard = () => {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isUser } = useUserRole(user?.id);
  const { isDesktop } = useMobileDetect();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalParents: 0,
    expectedCollection: 0,
    actualCollection: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Name editing state
  const [userName, setUserName] = useState<string | null>(null);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardStats();
    };
    fetchData();
  }, []);

  // Get user name from metadata
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.name || user.user_metadata?.full_name || null;
      setUserName(name);
      // Auto-open dialog if no name set
      if (!name) {
        setIsNameDialogOpen(true);
      }
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSavingName(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-user-name', {
        body: { name: editName.trim() },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        toast.error('Failed to update name');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setUserName(editName.trim());
      setIsNameDialogOpen(false);
      setEditName('');
      toast.success('Name updated');
    } catch (error) {
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const openNameDialog = () => {
    setEditName(userName || '');
    setIsNameDialogOpen(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      const { count: totalParents } = await supabase
        .from('parents')
        .select('*', { count: 'exact', head: true });

      const { data: activeStudents } = await supabase
        .from('students')
        .select('monthly_fee')
        .eq('is_active', true);

      const expectedCollection = activeStudents?.reduce((sum, s) => sum + Number(s.monthly_fee), 0) || 0;

      const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
      const currentYear = new Date().getFullYear();
      const { data: monthPayments } = await supabase
        .from('fee_payments')
        .select('amount_paid')
        .eq('month', currentMonthName)
        .eq('payment_year', currentYear);

      const actualCollection = monthPayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;

      setStats({
        totalStudents: totalStudents || 0,
        totalParents: totalParents || 0,
        expectedCollection,
        actualCollection,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: 'All students',
      icon: GraduationCap,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Total Parents',
      value: stats.totalParents,
      subtitle: 'Registered families',
      icon: Users,
      iconBg: 'bg-emerald/10',
      iconColor: 'text-emerald',
    },
    {
      title: 'Expected Collection',
      value: `Rs. ${stats.expectedCollection.toLocaleString()}`,
      subtitle: new Date().toLocaleString('en-US', { month: 'long' }),
      icon: TrendingUp,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    {
      title: 'Actual Collection',
      value: `Rs. ${stats.actualCollection.toLocaleString()}`,
      subtitle: new Date().toLocaleString('en-US', { month: 'long' }),
      icon: DollarSign,
      iconBg: 'bg-emerald/10',
      iconColor: 'text-emerald',
    },
  ];

  if (isDesktop) {
    return <DesktopWarning />;
  }

  if (loading) {
    return (
      <MobileContainer>
        <div className="bg-primary text-primary-foreground p-6 pb-8">
          <div className="skeleton h-8 w-48 mb-2 bg-primary-foreground/20" />
          <div className="skeleton h-4 w-32 bg-primary-foreground/20" />
        </div>
        <div className="p-4 space-y-3 -mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
        <MobileNav />
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <NetworkStatus />
      <InstallPrompt />
      
      {/* Header with emerald gradient + gold accent */}
      <div className="bg-gradient-to-br from-primary via-primary to-emerald text-primary-foreground p-6 pb-10 shadow-lg relative overflow-hidden">
        {/* Decorative gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/60 via-accent to-accent/60" />
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BAB UL ILM" className="h-10 w-10 rounded-lg shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold mobile-fade-in">
                  {getGreeting()}{userName ? `, ${userName}` : ''}!
                </h1>
                <button
                  onClick={openNameDialog}
                  className="p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
                  aria-label={userName ? 'Edit name' : 'Set your name'}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs opacity-80 mobile-fade-in mt-0.5">BAB UL ILM K12 International</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInstallGuide(true)}
              className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors mobile-fade-in"
              aria-label="Installation guide"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors mobile-fade-in"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Urdu tagline */}
        <p className="text-sm opacity-80 font-urdu leading-relaxed text-center mt-2">
          رہبر ترقی و کمال
        </p>
      </div>

      {/* Name Edit Dialog */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userName ? 'Update Your Name' : 'Set Your Name'}</DialogTitle>
            <DialogDescription>
              {userName 
                ? 'Update your display name for personalized greetings.' 
                : 'Please enter your name to personalize your experience.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-name">Name</Label>
              <Input
                id="mobile-name"
                placeholder="Enter your name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
            </div>
          </div>
          <DialogFooter>
            {userName && (
              <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSaveName} disabled={savingName}>
              {savingName ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Grid with branded cards */}
      <div className="p-4 space-y-3 -mt-5">
        {statCards.map((stat, idx) => (
          <Card 
            key={idx} 
            className="shadow-md hover:shadow-lg transition-all duration-200 mobile-card-enter border-l-4 border-l-accent/50 bg-card"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.iconBg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MobileNav />
      <InstallGuide open={showInstallGuide} onOpenChange={setShowInstallGuide} />
    </MobileContainer>
  );
};

export default MobileDashboard;