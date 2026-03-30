import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  UserPlus,
  TrendingUp,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  LogOut,
  BookOpen,
  ClipboardList,
  Truck,
  BarChart3,
  UserCog,
  Settings,
  FileSpreadsheet,
  ArrowRightLeft,
  BadgePercent,
  UserMinus,
  ArrowUpFromLine,
  User,
  KeyRound,
  School,
  CreditCard
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isUser } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalParents: 0,
    expectedCollection: 0,
    actualCollection: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // User menu state
  const [userName, setUserName] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<{name?: string, logo_url?: string, address?: string, phone?: string, email?: string} | null>(null);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Get user name from metadata
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.name || user.user_metadata?.full_name || null;
      setUserName(name);
    }
  }, [user]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('name, address, phone, email, logo_url')
          .limit(1)
          .maybeSingle();

        if (schoolError && schoolError.code !== 'PGRST116') {
          console.error("Error fetching school data", schoolError);
        }
          
        if (!schoolData || 
            !schoolData.name || 
            schoolData.name === 'My School' || 
            !schoolData.address || 
            !schoolData.phone || 
            !schoolData.email) {
          toast.warning("Please complete your school profile to access the dashboard.");
          navigate('/school-settings');
          return;
        }
        
        setSchoolInfo(schoolData);
      }

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

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
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
        console.error('Error updating name:', error);
        toast.error('Failed to update name');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      await supabase.auth.refreshSession();
      setUserName(editName.trim());
      setIsNameDialogOpen(false);
      setEditName('');
      toast.success('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setSavingPassword(false);
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

  const getUserInitials = () => {
    if (!userName) return user?.email?.charAt(0).toUpperCase() || 'U';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return userName.charAt(0).toUpperCase();
  };

  const quickActions = [
    {
      title: 'Collect Fee',
      description: 'Record student fee payment',
      icon: Receipt,
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/20',
      route: '/fee-collection',
    },
    {
      title: 'Enroll Student',
      description: 'Add new student',
      icon: UserPlus,
      color: 'text-success',
      bgColor: 'bg-success/10 hover:bg-success/20',
      route: '/enrollment',
    },
    {
      title: 'Add Income',
      description: 'Record income transaction',
      icon: ArrowDownCircle,
      color: 'text-accent',
      bgColor: 'bg-accent/10 hover:bg-accent/20',
      route: '/accounts/income',
    },
    {
      title: 'Add Expense',
      description: 'Record expense transaction',
      icon: ArrowUpCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10 hover:bg-destructive/20',
      route: '/accounts/expense',
    },
  ];

  const adminLinks = [
    // === RECORDS ===
    {
      title: 'Student & Parent Records',
      description: 'View and manage all student and parent information',
      icon: Users,
      route: '/student-parent-records',
      category: 'Records',
    },
    {
      title: 'Staff',
      description: 'Manage staff and teacher information',
      icon: GraduationCap,
      route: '/manage-teachers',
      category: 'Records',
    },
    {
      title: 'Classes',
      description: 'Manage class structure and fees',
      icon: BookOpen,
      route: '/manage-classes',
      category: 'Records',
    },
    // === FEES & COLLECTIONS ===
    {
      title: 'Fee Management',
      description: 'View fee records & reprint receipts',
      icon: Receipt,
      route: '/fee-management',
      category: 'Fees & Collections',
    },
    {
      title: 'Collections Management',
      description: 'Manage fee collections',
      icon: ClipboardList,
      route: '/manage-collections',
      category: 'Fees & Collections',
    },
    {
      title: 'Balance Write-Offs',
      description: 'Write off parent balances',
      icon: BadgePercent,
      route: '/balance-writeoff',
      category: 'Fees & Collections',
    },
    // === ACCOUNTS ===
    {
      title: 'Account Categories',
      description: 'Manage income and expense categories',
      icon: Settings,
      route: '/accounts/categories',
      category: 'Accounts',
    },
    {
      title: 'Financial Reports',
      description: 'View comprehensive reports',
      icon: BarChart3,
      route: '/reports',
      category: 'Accounts',
    },
    // === SUPPLIERS ===
    {
      title: 'Manage Suppliers',
      description: 'View and add suppliers',
      icon: Truck,
      route: '/manage-suppliers',
      category: 'Suppliers',
    },
    {
      title: 'Supplier Transactions',
      description: 'Record payments and bills',
      icon: ArrowRightLeft,
      route: '/supplier-transactions',
      category: 'Suppliers',
    },
    {
      title: 'Supplier Reports',
      description: 'View supplier ledgers and balances',
      icon: FileSpreadsheet,
      route: '/supplier-reports',
      category: 'Suppliers',
    },
    // === BOOKS & INVENTORY ===
    {
      title: 'Manage Books',
      description: 'Book items, sets, and stock',
      icon: BookOpen,
      route: '/manage-books',
      category: 'Books & Inventory',
    },
    {
      title: 'Book Sales',
      description: 'Sell books to students',
      icon: Receipt,
      route: '/book-sales',
      category: 'Books & Inventory',
    },
    // === SETTINGS & ADMIN ===
    {
      title: 'User Management',
      description: 'Manage staff accounts and roles',
      icon: UserCog,
      route: '/manage-users',
      category: 'Settings',
    },
    {
      title: 'Class Promotion',
      description: 'Promote students to next class',
      icon: ArrowUpFromLine,
      route: '/class-promotion',
      category: 'Settings',
    },
    {
      title: 'Student Pass-Out',
      description: 'Mark students as passed out',
      icon: UserMinus,
      route: '/student-passout',
      category: 'Settings',
    },
    {
      title: 'School Settings',
      description: 'Update school details and logo',
      icon: School,
      route: '/school-settings',
      category: 'Settings',
    },
    {
      title: 'Billing & Credits',
      description: 'Manage subscription and buy credits',
      icon: CreditCard,
      route: '/billing',
      category: 'Settings',
    },
  ];

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: 'All students',
      icon: GraduationCap,
      color: 'text-primary',
    },
    {
      title: 'Total Parents',
      value: stats.totalParents,
      subtitle: 'Registered families',
      icon: Users,
      color: 'text-success',
    },
    {
      title: 'Expected Collection',
      value: `Rs. ${stats.expectedCollection.toLocaleString()}`,
      subtitle: new Date().toLocaleString('en-US', { month: 'long' }),
      icon: TrendingUp,
      color: 'text-accent',
    },
    {
      title: 'Actual Collection',
      value: `Rs. ${stats.actualCollection.toLocaleString()}`,
      subtitle: new Date().toLocaleString('en-US', { month: 'long' }),
      icon: DollarSign,
      color: 'text-success',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4 mt-20">
        {/* Header with Greeting and User Menu */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              {schoolInfo?.logo_url && (
                <img 
                  src={schoolInfo.logo_url} 
                  alt="School Logo" 
                  className="h-10 w-10 object-contain rounded-md bg-white p-1 border"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              {schoolInfo?.name ? schoolInfo.name : `${getGreeting()}${userName ? `, ${userName}` : ''}!`}
            </h1>
            <p className="text-muted-foreground">
              {schoolInfo?.name 
                ? `Welcome back, ${userName || 'Administrator'}. Here is your school's overview.`
                : "Here's an overview of your school management system."}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-semibold"
              >
                {getUserInitials()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={openNameDialog}>
                <User className="mr-2 h-4 w-4" />
                {userName ? 'Change Name' : 'Set Name'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Name Edit Dialog */}
        <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{userName ? 'Change Your Name' : 'Set Your Name'}</DialogTitle>
              <DialogDescription>
                Enter your display name for personalized greetings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveName} disabled={savingName}>
                {savingName ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter a new password for your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? 'Saving...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Grid / Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Card 
                key={idx}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${action.bgColor} border-0`}
                onClick={() => navigate(action.route)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-background`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Admin Tools - Only visible to admins */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
            {['Records', 'Fees & Collections', 'Accounts', 'Suppliers', 'Books & Inventory', 'Settings'].map((category) => {
              const categoryLinks = adminLinks.filter(link => link.category === category);
              if (categoryLinks.length === 0) return null;
              return (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryLinks.map((link, idx) => (
                      <Card 
                        key={idx}
                        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-accent/50 border-l-4 border-l-accent"
                        onClick={() => navigate(link.route)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <link.icon className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{link.title}</h3>
                              <p className="text-sm text-muted-foreground">{link.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
