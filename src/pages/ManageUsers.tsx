import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  ArrowLeft, 
  UserPlus,
  Search,
  Users,
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  User,
  Key,
  UserX,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmailInput, useCompleteEmail } from '@/components/ui/email-input';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { format } from 'date-fns';
import { formatDate } from '@/lib/utils';

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  name?: string;
  last_sign_in_at?: string;
}

const AVAILABLE_ROLES = ['admin', 'user'];

type UserRole = 'admin' | 'user';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'user'], { required_error: 'Please select a role' }),
});

const ManageUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  
  // Delete dialog state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  
  // Edit role state (now single role)
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [editingRole, setEditingRole] = useState<string>('');
  const [savingRoles, setSavingRoles] = useState(false);
  
  // Create user dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState<UserRole | ''>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Password reset dialog state
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  // Deactivate dialog state (we'll just toggle roles for now as Supabase doesn't have built-in deactivate)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  
  const completeEmail = useCompleteEmail(createEmail);
  
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }

      if (data?.error) {
        console.error('API error:', data.error);
        toast.error(data.error);
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.name?.toLowerCase().includes(query) ||
        u.roles.some(r => r.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    users: users.filter(u => u.roles.includes('user')).length,
  }), [users]);

  const handleUserClick = (userItem: UserWithRoles) => {
    setSelectedUser(userItem);
    setIsEditingRoles(false);
    setEditingRole('');
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setIsEditingRoles(false);
    setEditingRole('');
  };

  // Delete user handlers
  const handleDeleteClick = (userItem: UserWithRoles) => {
    setUserToDelete(userItem);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeletingUserId(userToDelete.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
      }
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Edit role handlers (single role)
  const startEditingRoles = () => {
    if (selectedUser) {
      setIsEditingRoles(true);
      // Get the first available role or empty
      const currentRole = selectedUser.roles.find(r => AVAILABLE_ROLES.includes(r)) || '';
      setEditingRole(currentRole);
    }
  };

  const cancelEditingRoles = () => {
    setIsEditingRoles(false);
    setEditingRole('');
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    
    try {
      setSavingRoles(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      // Send single role as array
      const rolesToSave = editingRole ? [editingRole] : [];

      const { data, error } = await supabase.functions.invoke('update-user-roles', {
        body: { userId: selectedUser.id, roles: rolesToSave },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error updating role:', error);
        toast.error('Failed to update role');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Role updated successfully');
      setIsEditingRoles(false);
      setEditingRole('');
      
      // Update local state
      const updatedUser = { ...selectedUser, roles: rolesToSave };
      setSelectedUser(updatedUser);
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setSavingRoles(false);
    }
  };

  // Create user handlers
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCreatePassword(password);
    toast.success('Password generated');
  };

  const handleCreateUser = async () => {
    try {
      createUserSchema.parse({ email: completeEmail, password: createPassword, name: createName, role: createRole });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    setCreateLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: completeEmail, password: createPassword, role: createRole, name: createName },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating user:', error);
        toast.error(error.message || 'Failed to create user');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('User created successfully');
      toast.info(`Credentials: ${completeEmail} / ${createPassword}`, { duration: 10000 });
      
      // Reset form
      setCreateEmail('');
      setCreatePassword('');
      setCreateName('');
      setCreateRole('');
      setIsCreateDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setCreateLoading(false);
    }
  };

  // Password reset handlers
  const generateResetPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setResetPassword(password);
    toast.success('Password generated');
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPassword) return;
    
    if (resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setResetPasswordLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: selectedUser.id, newPassword: resetPassword },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error resetting password:', error);
        toast.error('Failed to reset password');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Password reset successfully');
      toast.info(`New password: ${resetPassword}`, { duration: 10000 });
      setIsResetPasswordDialogOpen(false);
      setResetPassword('');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Deactivate handler - removes all roles
  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    
    setDeactivateLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-user-roles', {
        body: { userId: selectedUser.id, roles: [] },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error deactivating user:', error);
        toast.error('Failed to deactivate user');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('User deactivated - all roles removed');
      setIsDeactivateDialogOpen(false);
      
      // Update local state
      const updatedUser = { ...selectedUser, roles: [] };
      setSelectedUser(updatedUser);
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setDeactivateLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-screen mt-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto py-8 mt-20 px-4">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Access denied. Admin privileges required.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 mt-20">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage user accounts and role assignments
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.admins}</p>
                    <p className="text-sm text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.users}</p>
                    <p className="text-sm text-muted-foreground">Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Resizable Split Panel */}
          <ResizablePanelGroup 
            direction="horizontal" 
            className="h-[calc(100vh-280px)] min-h-[500px] rounded-lg border bg-card"
          >
            {/* Left Panel - User List */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg mb-2">All Users</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredUsers.map((userItem) => (
                        <div
                          key={userItem.id}
                          onClick={() => handleUserClick(userItem)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedUser?.id === userItem.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {userItem.name || 'Unnamed User'}
                                </p>
                                {userItem.id === user?.id && (
                                  <Badge variant="outline" className="text-xs">You</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {userItem.email}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {userItem.roles.filter(r => AVAILABLE_ROLES.includes(r)).length > 0 ? (
                                userItem.roles.filter(r => AVAILABLE_ROLES.includes(r)).map((role) => (
                                  <Badge 
                                    key={role} 
                                    variant={role === 'admin' ? 'default' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">No role</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {!loading && (
                  <div className="p-3 border-t text-sm text-muted-foreground text-center">
                    {filteredUsers.length} users
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - User Details */}
            <ResizablePanel defaultSize={65} minSize={40}>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">User Details</h3>
                </div>
                <ScrollArea className="flex-1">
                  {selectedUser ? (
                    <div className="p-6 space-y-6">
                      {/* User Info */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {selectedUser.name || 'Unnamed User'}
                            </h3>
                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid gap-4">
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{selectedUser.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Created</p>
                              <p className="font-medium">
                                {formatDate(selectedUser.created_at)}
                              </p>
                            </div>
                          </div>

                          {selectedUser.last_sign_in_at && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">Last Sign In</p>
                                <p className="font-medium">
                                  {formatDate(selectedUser.last_sign_in_at, true)}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Roles Section */}
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Roles</p>
                              </div>
                              {!isEditingRoles && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={startEditingRoles}
                                  disabled={selectedUser.id === user?.id}
                                  title={selectedUser.id === user?.id ? "Cannot edit your own roles" : "Edit roles"}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            {isEditingRoles ? (
                              <div className="space-y-3">
                                <Select
                                  value={editingRole}
                                  onValueChange={setEditingRole}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_ROLES.map((role) => (
                                      <SelectItem key={role} value={role} className="capitalize">
                                        {role === 'admin' ? 'Admin' : 'User'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={saveRoles}
                                    disabled={savingRoles || !editingRole}
                                  >
                                    {savingRoles ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Save
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={cancelEditingRoles}
                                    disabled={savingRoles}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 flex-wrap">
                                {selectedUser.roles.filter(r => AVAILABLE_ROLES.includes(r)).length > 0 ? (
                                  selectedUser.roles.filter(r => AVAILABLE_ROLES.includes(r)).map((role) => (
                                    <Badge 
                                      key={role} 
                                      variant={role === 'admin' ? 'default' : 'secondary'}
                                      className="capitalize"
                                    >
                                      {role}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No roles assigned (Deactivated)</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* User ID (for reference) */}
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">User ID</p>
                              <p className="font-mono text-xs">{selectedUser.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {selectedUser.id !== user?.id && (
                        <div className="pt-4 border-t space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground mb-3">Account Actions</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setResetPassword('');
                                setIsResetPasswordDialogOpen(true);
                              }}
                              className="w-full"
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsDeactivateDialogOpen(true)}
                              className="w-full"
                              disabled={selectedUser.roles.length === 0}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDeleteClick(selectedUser)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                      <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        Select a user to view details
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                placeholder="Enter full name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <EmailInput
                id="create-email"
                value={createEmail}
                onChange={setCreateEmail}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-password">Temporary Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="create-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select value={createRole} onValueChange={(value: UserRole) => setCreateRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createLoading}>
              {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="reset-password"
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generateResetPassword}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetPasswordLoading || !resetPassword}>
              {resetPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{selectedUser?.name || selectedUser?.email}</strong>? 
              This will remove all their roles and they will no longer have access to any features. 
              You can reactivate them later by assigning roles again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateUser}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {deactivateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name || userToDelete?.email}</strong>? 
              This action cannot be undone and will remove all their data and roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUserId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageUsers;
