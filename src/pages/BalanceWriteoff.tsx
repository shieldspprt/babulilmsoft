import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCnic } from '@/lib/utils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { toast } from 'sonner';
import { 
  Search, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft, 
  Users, 
  User, 
  CreditCard, 
  Phone, 
  Calendar,
  FileText,
  History,
  GraduationCap,
  DollarSign,
  Zap,
  List
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '@/lib/utils';

interface Parent {
  id: string;
  parent_id: string;
  father_name: string;
  phone: string;
  cnic: string;
  current_balance: number;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  monthly_fee: number;
  is_active: boolean;
  outstandingBalance: number;
}

interface WriteoffHistory {
  id: string;
  writeoff_date: string;
  student_name: string;
  writeoff_amount: number;
  reason: string;
  notes: string;
}

interface AllWriteoffRecord {
  id: string;
  writeoff_date: string;
  writeoff_amount: number;
  original_amount: number;
  reason: string;
  notes: string | null;
  writeoff_type: string;
  parent_name: string;
  parent_id_display: string;
  student_name: string;
}

const BalanceWriteoff = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'writeoff' | 'history'>('writeoff');
  const [loading, setLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allParents, setAllParents] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [writeoffHistory, setWriteoffHistory] = useState<WriteoffHistory[]>([]);

  // All writeoffs for history tab
  const [allWriteoffs, setAllWriteoffs] = useState<AllWriteoffRecord[]>([]);
  const [allWriteoffsLoading, setAllWriteoffsLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const [writeoffAmounts, setWriteoffAmounts] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load all parents with outstanding balance on mount
  useEffect(() => {
    if (isAdmin) {
      loadParents();
    }
  }, [isAdmin]);

  const loadParents = async () => {
    setParentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('id, parent_id, father_name, phone, cnic, current_balance')
        .gt('current_balance', 0)
        .order('father_name');

      if (error) throw error;
      setAllParents(data || []);
    } catch (err) {
      console.error('Failed to load parents:', err);
      toast.error('Failed to load parents');
    } finally {
      setParentsLoading(false);
    }
  };

  // Filter parents based on search
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return allParents;
    
    const query = searchQuery.toLowerCase();
    return allParents.filter(parent => 
      parent.father_name.toLowerCase().includes(query) ||
      parent.parent_id.toLowerCase().includes(query) ||
      parent.cnic.toLowerCase().includes(query) ||
      parent.phone.includes(query)
    );
  }, [allParents, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    totalParents: allParents.length,
    totalOutstanding: allParents.reduce((sum, p) => sum + (p.current_balance || 0), 0),
  }), [allParents]);

  const selectParent = async (parent: Parent) => {
    setSelectedParent(parent);
    setSelectedStudents(new Set());
    setWriteoffAmounts({});
    setReason('');
    setCustomReason('');
    setNotes('');

    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', parent.id)
        .eq('is_active', true)
        .order('name');

      if (studentsError) throw studentsError;

      // Calculate proportional outstanding balance based on monthly fee ratio
      const totalMonthlyFees = (studentsData || []).reduce((sum, s) => sum + (s.monthly_fee || 0), 0);
      const parentBalance = parent.current_balance || 0;

      const studentsWithBalances = (studentsData || []).map((student) => {
        let outstandingBalance = 0;
        if (totalMonthlyFees > 0 && parentBalance > 0) {
          outstandingBalance = (student.monthly_fee / totalMonthlyFees) * parentBalance;
        } else if (studentsData?.length === 1 && parentBalance > 0) {
          outstandingBalance = parentBalance;
        }

        return {
          ...student,
          outstandingBalance: Math.round(outstandingBalance)
        };
      });

      setStudents(studentsWithBalances);
      await loadWriteoffHistory(parent.id);
    } catch (error: any) {
      console.error('Error loading parent data:', error);
      toast.error('Failed to load student information');
    }
  };

  const loadWriteoffHistory = async (parentId: string) => {
    const { data, error } = await supabase
      .from('balance_writeoffs')
      .select(`
        id,
        writeoff_date,
        writeoff_amount,
        reason,
        notes,
        student_id,
        students (name)
      `)
      .eq('parent_id', parentId)
      .order('writeoff_date', { ascending: false });

    if (error) {
      console.error('Error loading writeoff history:', error);
      return;
    }

    const formattedHistory = data.map((item: any) => ({
      id: item.id,
      writeoff_date: item.writeoff_date,
      student_name: item.students?.name || 'All Students',
      writeoff_amount: item.writeoff_amount,
      reason: item.reason,
      notes: item.notes || ''
    }));

    setWriteoffHistory(formattedHistory);
  };

  // Load all writeoffs for history tab
  const loadAllWriteoffs = async () => {
    setAllWriteoffsLoading(true);
    try {
      const { data, error } = await supabase
        .from('balance_writeoffs')
        .select(`
          id,
          writeoff_date,
          writeoff_amount,
          original_amount,
          reason,
          notes,
          writeoff_type,
          parent_id,
          student_id,
          parents (father_name, parent_id),
          students (name)
        `)
        .order('writeoff_date', { ascending: false })
        .limit(500);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        writeoff_date: item.writeoff_date,
        writeoff_amount: item.writeoff_amount,
        original_amount: item.original_amount,
        reason: item.reason,
        notes: item.notes,
        writeoff_type: item.writeoff_type,
        parent_name: item.parents?.father_name || 'Unknown',
        parent_id_display: item.parents?.parent_id || '',
        student_name: item.students?.name || 'All Students'
      }));

      setAllWriteoffs(formatted);
    } catch (err) {
      console.error('Failed to load all writeoffs:', err);
      toast.error('Failed to load writeoff history');
    } finally {
      setAllWriteoffsLoading(false);
    }
  };

  // Load all writeoffs when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && allWriteoffs.length === 0) {
      loadAllWriteoffs();
    }
  }, [activeTab]);

  // Filter all writeoffs based on search
  const filteredAllWriteoffs = useMemo(() => {
    if (!historySearchQuery.trim()) return allWriteoffs;
    
    const query = historySearchQuery.toLowerCase();
    return allWriteoffs.filter(w => 
      w.parent_name.toLowerCase().includes(query) ||
      w.parent_id_display.toLowerCase().includes(query) ||
      w.student_name.toLowerCase().includes(query) ||
      w.reason.toLowerCase().includes(query)
    );
  }, [allWriteoffs, historySearchQuery]);

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
      const newAmounts = { ...writeoffAmounts };
      delete newAmounts[studentId];
      setWriteoffAmounts(newAmounts);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Quick action: Write off full balance for all students
  const writeOffFullBalance = () => {
    if (students.length === 0) return;
    
    const allStudentIds = new Set(students.map(s => s.id));
    setSelectedStudents(allStudentIds);
    
    const amounts: Record<string, number> = {};
    students.forEach(s => {
      amounts[s.id] = s.outstandingBalance;
    });
    setWriteoffAmounts(amounts);
    
    toast.success('Full balance amounts filled for all students');
  };

  const calculateTotal = () => {
    return Object.values(writeoffAmounts).reduce((sum, amt) => sum + (amt || 0), 0);
  };

  const handleWriteoff = async () => {
    if (!selectedParent || !user) return;

    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    const hasAmounts = Array.from(selectedStudents).every(id => 
      writeoffAmounts[id] && writeoffAmounts[id] > 0
    );
    if (!hasAmounts) {
      toast.error('Please enter amount for all selected students');
      return;
    }

    const finalReason = reason === 'Custom' ? customReason : reason;
    if (!finalReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    // Validate amounts don't exceed outstanding balances
    for (const studentId of Array.from(selectedStudents)) {
      const student = students.find(s => s.id === studentId);
      if (student && writeoffAmounts[studentId] > student.outstandingBalance) {
        toast.error(`Amount for ${student.name} exceeds outstanding balance of Rs. ${Math.round(student.outstandingBalance)}`);
        return;
      }
    }

    setLoading(true);
    try {
      for (const studentId of Array.from(selectedStudents)) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        await supabase.from('balance_writeoffs').insert({
          parent_id: selectedParent.id,
          student_id: student.id,
          writeoff_type: 'general_balance',
          original_amount: student.outstandingBalance,
          writeoff_amount: writeoffAmounts[studentId],
          reason: finalReason,
          notes: notes.trim() || null,
          approved_by: user.id
        });
      }

      toast.success('Balance written off successfully!');
      
      // Reset form and reload data
      setSelectedStudents(new Set());
      setWriteoffAmounts({});
      setReason('');
      setCustomReason('');
      setNotes('');
      
      // Reload parents to reflect updated balances
      await loadParents();
      
      // Find the updated parent and re-select
      const { data: updatedParent } = await supabase
        .from('parents')
        .select('id, parent_id, father_name, phone, cnic, current_balance')
        .eq('id', selectedParent.id)
        .single();
      
      if (updatedParent) {
        if (updatedParent.current_balance > 0) {
          await selectParent(updatedParent);
        } else {
          // Parent has no more balance, deselect
          setSelectedParent(null);
          setStudents([]);
          setWriteoffHistory([]);
        }
      }
    } catch (error: any) {
      console.error('Writeoff error:', error);
      toast.error('Failed to write off balance');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-6 px-4 mt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Balance Write-Off</h1>
              <p className="text-muted-foreground text-sm">Manage outstanding balance write-offs</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'writeoff' | 'history')} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="writeoff" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Write-Off
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              All Transactions
            </TabsTrigger>
          </TabsList>

          {/* Write-Off Tab */}
          <TabsContent value="writeoff" className="space-y-6 mt-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalParents}</p>
                      <p className="text-sm text-muted-foreground">Parents with Balance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Rs. {Math.round(stats.totalOutstanding).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Resizable Split Panel */}
            <ResizablePanelGroup 
              direction="horizontal" 
              className="h-[calc(100vh-340px)] min-h-[500px] rounded-lg border bg-card"
            >
              {/* Left Panel - Parent List */}
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg mb-2">Parents with Outstanding Balance</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, ID, CNIC, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    {parentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredParents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'No parents match your search' : 'No parents with outstanding balance'}
                      </p>
                    ) : (
                      <div className="divide-y">
                        {filteredParents.map((parent) => (
                          <div
                            key={parent.id}
                            onClick={() => selectParent(parent)}
                            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedParent?.id === parent.id ? 'bg-muted' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{parent.father_name}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {parent.parent_id}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {parent.phone}
                                </p>
                              </div>
                              <Badge variant="destructive" className="whitespace-nowrap">
                                Rs. {Math.round(parent.current_balance).toLocaleString()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {!parentsLoading && (
                    <div className="p-3 border-t text-sm text-muted-foreground text-center">
                      {filteredParents.length} parents
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right Panel - Write-off Details */}
              <ResizablePanel defaultSize={65} minSize={40}>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">Write-off Details</h3>
                  </div>
                  <ScrollArea className="flex-1">
                    {!selectedParent ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <p>Select a parent to manage write-offs</p>
                      </div>
                    ) : (
                      <div className="p-6 space-y-6">
                        {/* Parent Info */}
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{selectedParent.father_name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedParent.parent_id}</p>
                          </div>
                          <Badge variant="destructive" className="text-base px-3 py-1">
                            Rs. {Math.round(selectedParent.current_balance).toLocaleString()}
                          </Badge>
                        </div>

                        {/* Parent Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{selectedParent.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">CNIC</p>
                              <p className="font-medium">{formatCnic(selectedParent.cnic)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Students Section */}
                        {students.length === 0 ? (
                          <Card>
                            <CardContent className="text-center py-8 text-muted-foreground">
                              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No active students found for this parent</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            <Card>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <GraduationCap className="h-5 w-5" />
                                      Select Students
                                    </CardTitle>
                                    <CardDescription>Choose students and enter write-off amounts</CardDescription>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={writeOffFullBalance}
                                    className="flex items-center gap-2"
                                  >
                                    <Zap className="h-4 w-4" />
                                    Write Off Full Balance
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {students.map((student) => (
                                  <div 
                                    key={student.id} 
                                    className={`p-4 border rounded-lg transition-colors ${
                                      selectedStudents.has(student.id) ? 'border-primary bg-primary/5' : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-4">
                                      <Checkbox
                                        checked={selectedStudents.has(student.id)}
                                        onCheckedChange={() => toggleStudent(student.id)}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <p className="font-semibold">{student.name}</p>
                                            <div className="flex gap-3 text-sm text-muted-foreground">
                                              <span>{student.student_id}</span>
                                              <Badge variant="outline">{student.class}</Badge>
                                            </div>
                                          </div>
                                          <Badge variant="destructive">
                                            Rs. {Math.round(student.outstandingBalance).toLocaleString()}
                                          </Badge>
                                        </div>
                                        
                                        {selectedStudents.has(student.id) && (
                                          <div className="space-y-2">
                                            <Label htmlFor={`amount-${student.id}`}>Write-off Amount (Rs.)</Label>
                                            <Input
                                              id={`amount-${student.id}`}
                                              type="number"
                                              placeholder="0"
                                              value={writeoffAmounts[student.id] || ''}
                                              onChange={(e) => setWriteoffAmounts({
                                                ...writeoffAmounts,
                                                [student.id]: parseFloat(e.target.value) || 0
                                              })}
                                              max={student.outstandingBalance}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>

                            {/* Write-off Details Form */}
                            {selectedStudents.size > 0 && (
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Write-off Details
                                  </CardTitle>
                                  <CardDescription>Provide reason and additional information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="reason">Reason *</Label>
                                    <Select value={reason} onValueChange={setReason}>
                                      <SelectTrigger id="reason">
                                        <SelectValue placeholder="Select reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Financial Hardship">Financial Hardship</SelectItem>
                                        <SelectItem value="Student Graduated/Left School">Student Graduated/Left School</SelectItem>
                                        <SelectItem value="Irrecoverable Debt">Irrecoverable Debt</SelectItem>
                                        <SelectItem value="Administrative Adjustment">Administrative Adjustment</SelectItem>
                                        <SelectItem value="Custom">Custom Reason</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {reason === 'Custom' && (
                                    <div className="space-y-2">
                                      <Label htmlFor="customReason">Custom Reason *</Label>
                                      <Input
                                        id="customReason"
                                        placeholder="Enter custom reason"
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                      />
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                                    <Textarea
                                      id="notes"
                                      placeholder="Any additional details..."
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-4">
                                      <span className="text-lg font-semibold">Total Write-off Amount:</span>
                                      <span className="text-2xl font-bold text-destructive">
                                        Rs. {Math.round(calculateTotal()).toLocaleString()}
                                      </span>
                                    </div>
                                    
                                    <Button 
                                      onClick={() => setShowConfirmDialog(true)} 
                                      className="w-full"
                                      variant="destructive"
                                      disabled={!reason || (reason === 'Custom' && !customReason) || calculateTotal() === 0 || loading}
                                    >
                                      {loading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                      ) : (
                                        <><AlertTriangle className="w-4 h-4 mr-2" /> Write Off Balance</>
                                      )}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Write-off History for this parent */}
                            {writeoffHistory.length > 0 && (
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Write-off History
                                  </CardTitle>
                                  <CardDescription>Previous write-offs for this parent</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Student</TableHead>
                                          <TableHead>Reason</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {writeoffHistory.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell>
                                              {formatDate(item.writeoff_date)}
                                            </TableCell>
                                            <TableCell>{item.student_name}</TableCell>
                                            <TableCell className="text-sm">{item.reason}</TableCell>
                                            <TableCell className="text-right text-destructive font-medium">
                                              Rs. {Math.round(Number(item.writeoff_amount)).toLocaleString()}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>

          {/* All Transactions History Tab */}
          <TabsContent value="history" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      All Write-off Transactions
                    </CardTitle>
                    <CardDescription>Complete history of all balance write-offs</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAllWriteoffs}
                    disabled={allWriteoffsLoading}
                  >
                    {allWriteoffsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by parent name, ID, student, or reason..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="pl-9 max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {allWriteoffsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredAllWriteoffs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{historySearchQuery ? 'No transactions match your search' : 'No write-off transactions found'}</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Parent</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Original</TableHead>
                          <TableHead className="text-right">Written Off</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAllWriteoffs.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(item.writeoff_date)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.parent_name}</p>
                                <p className="text-xs text-muted-foreground">{item.parent_id_display}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.student_name}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{item.reason}</p>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.notes}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              Rs. {Math.round(Number(item.original_amount)).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-destructive font-medium">
                              Rs. {Math.round(Number(item.writeoff_amount)).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {!allWriteoffsLoading && filteredAllWriteoffs.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {filteredAllWriteoffs.length} transactions
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Balance Write-Off
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to write off these balances? This action cannot be undone.</p>
              <div className="p-3 bg-muted rounded-md mt-3 space-y-2">
                <p className="text-sm"><strong>Total Amount:</strong> Rs. {Math.round(calculateTotal()).toLocaleString()}</p>
                <p className="text-sm"><strong>Students:</strong> {selectedStudents.size}</p>
                <p className="text-sm"><strong>Reason:</strong> {reason === 'Custom' ? customReason : reason}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleWriteoff}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Confirm Write-Off'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BalanceWriteoff;
