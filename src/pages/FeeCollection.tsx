import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { PaymentSuccessDialog } from '@/components/fee-collection/PaymentSuccessDialog';
import { formatCnic } from '@/lib/utils';

interface Parent {
  id: string;
  parent_id: string;
  father_name: string;
  cnic: string;
  phone: string;
  current_balance: number;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  monthly_fee: number;
  concessions?: any[];
  individualDiscount: number;
  siblingDiscount: number;
  netFee: number;
  date_of_admission: string | null;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  amount: number;
  is_class_specific: boolean;
}

interface TransactionHistory {
  id: string;
  transaction_number: string;
  transaction_type: 'charge' | 'payment';
  amount: number;
  transaction_date: string;
  payment_method?: string;
  description: string;
  transaction_line_items?: Array<{
    description: string;
    amount: number;
  }>;
}

const FeeCollection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [paidMonthsByStudent, setPaidMonthsByStudent] = useState<Record<string, Set<string>>>({});
  
  // Payment type: monthly, balance, or collection
  const [paymentType, setPaymentType] = useState<'monthly' | 'collection'>('monthly');
  
  // Monthly fee fields
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  
  // Custom collection fields
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collectionAmounts, setCollectionAmounts] = useState<Record<string, number>>({});
  
  // Common fields
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [amountPayingNow, setAmountPayingNow] = useState<string>('');
  
  // One-time discount
  const [oneTimeDiscount, setOneTimeDiscount] = useState<string>('');
  const [oneTimeDiscountType, setOneTimeDiscountType] = useState<'amount' | 'percentage'>('amount');
  
  // Receipt dialog
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Generate 7-month window: 3 months before + current + 3 months after
  const getMonthWindow = () => {
    const result = [];
    const now = new Date();
    
    // Start from 3 months before current month
    for (let i = -3; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const shortYear = date.getFullYear().toString().slice(-2);
      const fullYear = date.getFullYear();
      const monthNumber = date.getMonth() + 1;
      
      result.push({
        display: `${date.toLocaleString('default', { month: 'short' })} ${shortYear}`,
        fullMonth: monthName,
        year: fullYear,
        monthNumber: monthNumber,
        key: `${fullYear}-${monthNumber.toString().padStart(2, '0')}` // e.g., "2025-10"
      });
    }
    
    return result;
  };

  const monthOptions = getMonthWindow();

  const searchParents = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    const sanitized = searchQuery.trim().replace(/[^a-zA-Z0-9\s-]/g, '');
    
    if (sanitized.length < 2) {
      toast.error('Search term must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      // Search parents by parent_id, CNIC, or father_name
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .or(`parent_id.ilike.%${sanitized}%,cnic.ilike.%${sanitized}%,father_name.ilike.%${sanitized}%`)
        .limit(10);

      if (parentError) throw parentError;

      // Also search by student ID
      const { data: studentByIdData } = await supabase
        .from('students')
        .select('parent_id')
        .ilike('student_id', `%${sanitized}%`)
        .limit(5);

      // Search by student name
      const { data: studentByNameData } = await supabase
        .from('students')
        .select('parent_id')
        .ilike('name', `%${sanitized}%`)
        .limit(5);

      // Combine parent IDs from student searches
      const parentIdsFromStudents = new Set<string>();
      [...(studentByIdData || []), ...(studentByNameData || [])].forEach(s => {
        if (s.parent_id) parentIdsFromStudents.add(s.parent_id);
      });

      // Fetch parents for found students
      const combined = [...(parentData || [])];
      
      if (parentIdsFromStudents.size > 0) {
        const { data: parentsFromStudents } = await supabase
          .from('parents')
          .select('*')
          .in('id', Array.from(parentIdsFromStudents));

        (parentsFromStudents || []).forEach(p => {
          if (!combined.find(existing => existing.id === p.id)) {
            combined.push(p);
          }
        });
      }

      setSearchResults(combined);
      if (combined.length === 0) {
        toast.info('No parents found');
      }
    } catch (err) {
      toast.error('Failed to search parents');
    } finally {
      setLoading(false);
    }
  };

  const selectParent = async (parent: Parent) => {
    setSelectedParent(parent);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedStudents(new Set());
    setSelectedMonths(new Set());
    setCollectionAmounts({});
    
    // Fetch students with net fees
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parent.id)
      .eq('is_active', true);

    if (error) {
      toast.error('Failed to load students');
      return;
    }

    // Note: monthly_fee already includes permanent discounts applied to the student
    // We just need to fetch concessions for display purposes, but use monthly_fee directly as the netFee
    const studentsWithDiscounts = await Promise.all(
      (studentsData || []).map(async (student) => {
        const { data: concessions } = await supabase
          .from('student_concessions')
          .select('*, concession_categories(name)')
          .eq('student_id', student.id)
          .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`);

        // Calculate discounts from base_fee for display purposes only
        const baseFee = student.base_fee || student.monthly_fee;
        const individualDiscount = (concessions || []).reduce((sum, c) => {
          if (c.discount_type === 'percentage') {
            return sum + (baseFee * c.discount_value / 100);
          }
          return sum + c.discount_value;
        }, 0);

        const siblingCount = studentsData?.length || 0;
        let siblingDiscount = 0;
        if (siblingCount >= 2) {
          const { data: siblingDiscountData } = await supabase
            .from('sibling_discounts')
            .select('*')
            .eq('parent_id', parent.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (siblingDiscountData) {
            if (siblingDiscountData.discount_type === 'percentage') {
              siblingDiscount = baseFee * siblingDiscountData.discount_value / 100;
            } else {
              siblingDiscount = siblingDiscountData.discount_value;
            }
          }
        }

        // Use monthly_fee directly as the netFee since it already has discounts applied
        const netFee = student.monthly_fee;

        return {
          ...student,
          concessions: concessions || [],
          individualDiscount,
          siblingDiscount,
          netFee,
          date_of_admission: student.date_of_admission,
        };
      })
    );

    setStudents(studentsWithDiscounts);
    
    // Fetch transaction history
    const { data: history } = await supabase
      .from('parent_transactions')
      .select(`
        *,
        transaction_line_items(*)
      `)
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setTransactionHistory((history || []) as TransactionHistory[]);
    
    // Fetch paid months for each student (check 3 months before to 3 months after)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    const minYear = threeMonthsAgo.getFullYear();
    const maxYear = threeMonthsAhead.getFullYear();
    
    const { data: feePayments } = await supabase
      .from('fee_payments')
      .select('student_id, month, payment_year')
      .in('student_id', studentsData.map(s => s.id))
      .gte('payment_year', minYear)
      .lte('payment_year', maxYear);
    
    const paidMonthsMap: Record<string, Set<string>> = {};
    (feePayments || []).forEach(payment => {
      if (!paidMonthsMap[payment.student_id]) {
        paidMonthsMap[payment.student_id] = new Set();
      }
      // Create year-month key (e.g., "2025-10")
      const date = new Date(`${payment.month} 1, ${payment.payment_year}`);
      const monthKey = `${payment.payment_year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      paidMonthsMap[payment.student_id].add(monthKey);
    });
    
    setPaidMonthsByStudent(paidMonthsMap);
    
    if (paymentType === 'collection') {
      loadCollections();
    }
  };

  const loadCollections = async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast.error('Failed to load collections');
      return;
    }

  setCollections(data || []);
};

// Auto-fill collection amounts when collection or students change
useEffect(() => {
  if (selectedCollection && paymentType === 'collection') {
    const collection = collections.find(c => c.id === selectedCollection);
    if (collection?.amount && collection.amount > 0) {
      // Auto-fill fixed amount for all selected students
      const autoAmounts: { [key: string]: number } = {};
      selectedStudents.forEach(studentId => {
        autoAmounts[studentId] = collection.amount;
      });
      setCollectionAmounts(autoAmounts);
    }
  }
}, [selectedCollection, selectedStudents, paymentType, collections]);

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleMonth = (monthKey: string) => {
    // Check if this month is paid for all selected students
    const allStudentsPaid = Array.from(selectedStudents).every(studentId => 
      paidMonthsByStudent[studentId]?.has(monthKey)
    );
    
    // Don't allow selecting if all selected students have paid for this month
    if (allStudentsPaid && selectedStudents.size > 0) {
      return;
    }
    
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(monthKey)) {
      newSelected.delete(monthKey);
    } else {
      newSelected.add(monthKey);
    }
    setSelectedMonths(newSelected);
  };

  const isMonthDisabled = (monthKey: string) => {
    if (selectedStudents.size === 0) return false;
    
    // Check if ALL selected students have already paid for this month
    const allPaid = Array.from(selectedStudents).every(studentId => 
      paidMonthsByStudent[studentId]?.has(monthKey)
    );
    if (allPaid) return true;
    
    return false;
  };

  // Check if a month is before any selected student's admission date
  const isMonthBeforeAdmission = (monthKey: string) => {
    if (selectedStudents.size === 0) return false;
    
    // Parse month key (e.g., "2025-10") to get year and month
    const [year, month] = monthKey.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1); // First day of the month
    
    // Check if ALL selected students were admitted after this month
    return Array.from(selectedStudents).every(studentId => {
      const student = students.find(s => s.id === studentId);
      if (!student?.date_of_admission) return false; // If no admission date, allow the month
      
      const admissionDate = new Date(student.date_of_admission);
      const admissionMonthStart = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);
      
      // Month is before admission if it's earlier than the admission month
      return monthDate < admissionMonthStart;
    });
  };

  // Calculate one-time discount value
  const calculateOneTimeDiscount = () => {
    if (!oneTimeDiscount || parseFloat(oneTimeDiscount) <= 0) return 0;
    
    const discountValue = parseFloat(oneTimeDiscount);
    const baseCharge = students
      .filter(s => selectedStudents.has(s.id))
      .reduce((sum, s) => sum + (s.netFee * selectedMonths.size), 0);
    
    if (oneTimeDiscountType === 'percentage') {
      return Math.round((baseCharge * discountValue) / 100);
    }
    return Math.round(discountValue);
  };

  const calculateTotal = () => {
    let currentAmount = 0;
    if (paymentType === 'monthly') {
      const baseAmount = students
        .filter(s => selectedStudents.has(s.id))
        .reduce((sum, s) => sum + (s.netFee * selectedMonths.size), 0);
      
      // Apply one-time discount
      const discount = calculateOneTimeDiscount();
      currentAmount = Math.max(baseAmount - discount, 0);
    } else if (paymentType === 'collection') {
      currentAmount = Object.values(collectionAmounts).reduce((sum, amt) => sum + amt, 0);
    }
    const totalDue = (selectedParent?.current_balance || 0) + currentAmount;
    return Math.round(totalDue);
  };

  const handlePayment = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }
    
    if (paymentType === 'monthly' && selectedMonths.size === 0) {
      toast.error('Please select at least one month');
      return;
    }
    
    if (paymentType === 'collection' && !selectedCollection) {
      toast.error('Please select a collection');
      return;
    }
    
    if (!amountPayingNow || parseFloat(amountPayingNow) <= 0) {
      toast.error('Please enter the amount being paid');
      return;
    }

    setLoading(true);
    try {
      const cashReceived = parseFloat(amountPayingNow);
      const previousBalance = selectedParent!.current_balance;
      
      // Step 1: Calculate what we're charging them
      let totalCharge = 0;
      const lineItems: any[] = [];
      
      if (paymentType === 'monthly') {
        // Charge for selected students × selected months
        const monthsData = getMonthWindow();
        
        for (const studentId of Array.from(selectedStudents)) {
          const student = students.find(s => s.id === studentId);
          if (!student) continue;
          
          for (const monthKey of Array.from(selectedMonths)) {
            // Skip if this student has already paid for this month
            if (paidMonthsByStudent[studentId]?.has(monthKey)) {
              continue;
            }
            
            // Find month info from key (e.g., "2025-10")
            const monthInfo = monthsData.find(m => m.key === monthKey);
            if (!monthInfo) continue;
            
            totalCharge += student.netFee;
            lineItems.push({
              student_id: studentId,
              item_type: 'monthly_fee',
              month: monthInfo.fullMonth, // Store full month name (e.g., "October")
              year: monthInfo.year, // Store year for reference
              amount: student.netFee,
              description: `${student.name} - ${monthInfo.display}` // Display format: "Oct 25"
            });
          }
        }

        // Apply one-time discount to the total charge
        const oneTimeDiscountAmount = calculateOneTimeDiscount();
        if (oneTimeDiscountAmount > 0) {
          totalCharge = Math.max(totalCharge - oneTimeDiscountAmount, 0);
          lineItems.push({
            student_id: null,
            item_type: 'discount',
            amount: -oneTimeDiscountAmount,
            description: `One-time Discount${oneTimeDiscountType === 'percentage' ? ` (${oneTimeDiscount}%)` : ''}`
          });
        }
      } else if (paymentType === 'collection') {
        const collection = collections.find(c => c.id === selectedCollection);
        if (!collection) return;
        
        for (const studentId of Array.from(selectedStudents)) {
          const student = students.find(s => s.id === studentId);
          const amount = collectionAmounts[studentId] || 0;
          if (!student || amount <= 0) continue;
          
          totalCharge += amount;
          lineItems.push({
            student_id: studentId,
            item_type: 'collection',
            collection_id: selectedCollection,
            amount: amount,
            description: `${student.name} - ${collection.name}`
          });
        }
      }
      
      // Step 2: Insert CHARGE transaction (if billing)
      let chargeTransactionNumber = '';
      if (totalCharge > 0) {
        const { data: charge, error: chargeError } = await supabase
          .from('parent_transactions')
          .insert({
            parent_id: selectedParent!.id,
            transaction_type: 'charge',
            amount: totalCharge,
            transaction_date: new Date().toISOString().split('T')[0],
            description: `Charges for ${paymentType === 'monthly' ? 'monthly fees' : 'collection'}`,
            recorded_by: user?.id,
            notes: notes || null
          })
          .select()
          .single();
        
        if (chargeError) throw chargeError;
        chargeTransactionNumber = charge.transaction_number;
        
        // Insert line items
        if (lineItems.length > 0) {
          await supabase
            .from('transaction_line_items')
            .insert(lineItems.map(li => ({
              ...li,
              transaction_id: charge.id
            })));
          
          // Insert fee_payments records for monthly fees
          if (paymentType === 'monthly') {
            // Calculate the total monthly fee charges (excluding discounts)
            const monthlyFeeItems = lineItems.filter(li => li.item_type === 'monthly_fee');
            const totalMonthlyCharges = monthlyFeeItems.reduce((sum, li) => sum + li.amount, 0);
            
            // Calculate proportional payment for each line item based on cash received
            // If cashReceived >= totalCharge, each item is fully paid
            // Otherwise, distribute payment proportionally
            const feePaymentRecords = monthlyFeeItems.map(li => {
                const student = students.find(s => s.id === li.student_id);
                
                // Calculate proportional amount paid for this line item
                let proportionalAmountPaid = li.amount;
                if (cashReceived < totalCharge && totalMonthlyCharges > 0) {
                  // Distribute payment proportionally across line items
                  proportionalAmountPaid = Math.round((li.amount / totalMonthlyCharges) * Math.min(cashReceived, totalMonthlyCharges));
                }
                
                return {
                  parent_id: selectedParent!.id,
                  student_id: li.student_id,
                  month: li.month,
                  payment_year: li.year,
                  amount_paid: proportionalAmountPaid,
                  payment_date: new Date().toISOString().split('T')[0],
                  base_fee: student?.monthly_fee || 0,
                  total_discount: (student?.individualDiscount || 0) + (student?.siblingDiscount || 0),
                  individual_discount: student?.individualDiscount || 0,
                  sibling_discount: student?.siblingDiscount || 0,
                  net_amount: li.amount,
                  receipt_number: charge.transaction_number,
                  payment_method: paymentMethod,
                  recorded_by: user?.id,
                  notes: notes || null
                };
              });
            
            if (feePaymentRecords.length > 0) {
              await supabase
                .from('fee_payments')
                .insert(feePaymentRecords);
            }
          }
        }
      }
      
      // Step 3: Insert PAYMENT transaction (actual cash received)
      if (cashReceived > 0) {
        await supabase
          .from('parent_transactions')
          .insert({
            parent_id: selectedParent!.id,
            transaction_type: 'payment',
            amount: cashReceived,
            transaction_date: new Date().toISOString().split('T')[0],
            payment_method: paymentMethod,
            description: 'Payment received',
            recorded_by: user?.id,
            notes: notes || null
          })
          .select()
          .single();
      }
      
      // Step 4: Fetch updated parent balance
      const { data: updatedParent } = await supabase
        .from('parents')
        .select('current_balance')
        .eq('id', selectedParent!.id)
        .single();
      
      // Step 5: Generate receipt
      const receiptStudents = lineItems.map(li => {
        const student = students.find(s => s.id === li.student_id);
        return {
          name: student?.name || '',
          studentId: student?.student_id || '',
          class: student?.class || '',
          amount: li.amount,
          description: li.description
        };
      });

      const collectionInfo = paymentType === 'collection' 
        ? collections.find(c => c.id === selectedCollection)
        : null;
      
      // Convert month keys to display format for receipt
      const monthsData = getMonthWindow();
      const displayMonths = paymentType === 'monthly' 
        ? Array.from(selectedMonths).map(key => {
            const monthInfo = monthsData.find(m => m.key === key);
            return monthInfo?.display || key;
          })
        : undefined;

      setReceiptData({
        transactionNumber: chargeTransactionNumber,
        parentName: selectedParent!.father_name,
        parentId: selectedParent!.parent_id,
        phone: selectedParent!.phone,
        previousBalance: previousBalance,
        totalCharged: totalCharge,
        cashReceived: cashReceived,
        newBalance: updatedParent!.current_balance,
        students: receiptStudents,
        paymentDate: new Intl.DateTimeFormat('en-GB').format(new Date()),
        paymentMethod: paymentMethod,
        notes: notes,
        months: displayMonths,
        collectionName: collectionInfo?.name
      });

      setShowReceipt(true);
      setSelectedStudents(new Set());
      setSelectedMonths(new Set());
      setCollectionAmounts({});
      setNotes('');
      setAmountPayingNow('');
      setOneTimeDiscount('');
      setOneTimeDiscountType('amount');
      
      // Refresh parent data
      const { data: refreshedParent } = await supabase
        .from('parents')
        .select('*')
        .eq('id', selectedParent!.id)
        .single();
      
      if (refreshedParent) {
        setSelectedParent(refreshedParent);
      }
      
      toast.success('Transaction recorded successfully!');
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Fee Collection</h1>
          <p className="text-muted-foreground">Collect fees from parents and generate receipts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Search Parent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search by ID, CNIC, Parent Name, or Student Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchParents()}
                    placeholder="Enter search term"
                  />
                  <Button onClick={searchParents} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((parent) => (
                    <Card
                      key={parent.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => selectParent(parent)}
                    >
                      <p className="font-semibold">{parent.father_name}</p>
                      <p className="text-sm text-muted-foreground">ID: {parent.parent_id}</p>
                      <p className="text-sm text-muted-foreground">CNIC: {formatCnic(parent.cnic)}</p>
                    </Card>
                  ))}
                </div>
              )}

              {selectedParent && (
                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                  <h3 className="font-semibold mb-2">Selected Parent</h3>
                  <p className="text-sm">ID: {selectedParent.parent_id}</p>
                  <p className="text-sm">Name: {selectedParent.father_name}</p>
                  <p className="text-sm">Phone: {selectedParent.phone}</p>
                  <div className="pt-2 border-t">
                    {selectedParent.current_balance > 0 ? (
                      <p className="text-sm font-bold text-red-600">
                        Outstanding Balance: Rs. {Math.round(selectedParent.current_balance)}
                      </p>
                    ) : selectedParent.current_balance < 0 ? (
                      <p className="text-sm font-bold text-green-600">
                        Credit Balance: Rs. {Math.round(Math.abs(selectedParent.current_balance))}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-gray-600">
                        Balance: Rs. 0 (All Clear)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Collection Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fee Collection</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedParent ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Search and select a parent to collect fees</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No active students found for this parent</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Tabs value={paymentType} onValueChange={(v) => {
                    setPaymentType(v as any);
                    if (v === 'collection') loadCollections();
                  }}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="monthly">Monthly Fee</TabsTrigger>
                      <TabsTrigger value="collection">Custom Collection</TabsTrigger>
                    </TabsList>

                    {/* Monthly Fee Tab */}
                    <TabsContent value="monthly" className="space-y-6">
                      <div className="space-y-3">
                        <Label>Select Students</Label>
                        <div className="space-y-2">
                          {students.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={() => toggleStudent(student.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.student_id} | Class: {student.class}
                                </p>
                                <p className="text-sm font-semibold">
                                  Net Fee: Rs. {Math.round(student.netFee)}
                                  {student.individualDiscount > 0 || student.siblingDiscount > 0 ? (
                                    <span className="text-xs text-green-600 ml-2">
                                      (Discount: Rs. {Math.round(student.individualDiscount + student.siblingDiscount)})
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Select Months</Label>
                        {selectedStudents.size === 0 && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Please select students first to see available months
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {monthOptions
                            .filter((monthData) => !isMonthBeforeAdmission(monthData.key))
                            .map((monthData) => {
                              const disabled = isMonthDisabled(monthData.key);
                              return (
                                <div key={monthData.key} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedMonths.has(monthData.key)}
                                    onCheckedChange={() => toggleMonth(monthData.key)}
                                    disabled={disabled}
                                  />
                                  <Label 
                                    className={`text-sm font-normal ${disabled ? 'text-muted-foreground line-through' : ''}`}
                                  >
                                    {monthData.display}
                                    {disabled && <span className="ml-1 text-xs">(Paid)</span>}
                                  </Label>
                                </div>
                              );
                            })}
                        </div>
                        {selectedStudents.size > 0 && monthOptions.filter((m) => !isMonthBeforeAdmission(m.key)).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No months available - student(s) may have been admitted after the displayed period.
                          </p>
                        )}
                      </div>

                      {/* One-time Discount */}
                      {paymentType === 'monthly' && selectedStudents.size > 0 && selectedMonths.size > 0 && (
                        <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <Label className="text-green-700 dark:text-green-300">One-time Discount (Optional)</Label>
                          <div className="flex gap-2">
                            <Select 
                              value={oneTimeDiscountType} 
                              onValueChange={(v) => setOneTimeDiscountType(v as 'amount' | 'percentage')}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="amount">Rs. (Fixed)</SelectItem>
                                <SelectItem value="percentage">% (Percentage)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder={oneTimeDiscountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                              value={oneTimeDiscount}
                              onChange={(e) => setOneTimeDiscount(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                          {calculateOneTimeDiscount() > 0 && (
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Discount Applied: Rs. {calculateOneTimeDiscount()}
                            </p>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Collection Tab */}
                    <TabsContent value="collection" className="space-y-6">
                      <div className="space-y-3">
                        <Label>Select Collection</Label>
                        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((coll) => (
                              <SelectItem key={coll.id} value={coll.id}>
                                {coll.name}
                                {coll.amount > 0 ? ` - Rs. ${coll.amount} (Fixed)` : ' (Variable Amount)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Select Students & Enter Amounts</Label>
                        <div className="space-y-2">
                          {students.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={() => toggleStudent(student.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.student_id} | Class: {student.class}
                                </p>
                              </div>
                              {selectedStudents.has(student.id) && (
                                <div className="w-32">
                                  {(() => {
                                    const collection = collections.find(c => c.id === selectedCollection);
                                    if (collection?.amount && collection.amount > 0) {
                                      // Fixed amount - show badge
                                      return (
                                        <div className="px-3 py-2 bg-success/10 border border-success/30 rounded text-center">
                                          <span className="font-semibold text-success">Rs. {collection.amount}</span>
                                        </div>
                                      );
                                    } else {
                                      // Variable amount - show input
                                      return (
                                        <Input
                                          type="number"
                                          placeholder="Amount"
                                          value={collectionAmounts[student.id] || ''}
                                          onChange={(e) => setCollectionAmounts({
                                            ...collectionAmounts,
                                            [student.id]: parseFloat(e.target.value) || 0
                                          })}
                                        />
                                      );
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Payment Details */}
                  <div className="space-y-4 pt-6 border-t">
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Previous Balance:</span>
                        <span className={selectedParent.current_balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          Rs. {Math.round(selectedParent.current_balance)}
                        </span>
                      </div>
                      {paymentType === 'monthly' && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Base Charges:</span>
                            <span>Rs. {Math.round(students.filter(s => selectedStudents.has(s.id)).reduce((sum, s) => sum + (s.netFee * selectedMonths.size), 0))}</span>
                          </div>
                          {calculateOneTimeDiscount() > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>One-time Discount:</span>
                              <span>- Rs. {calculateOneTimeDiscount()}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Current Charges:</span>
                        <span>Rs. {Math.round(calculateTotal() - selectedParent.current_balance)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total Amount Due:</span>
                        <span>Rs. {Math.round(calculateTotal())}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount Paying Now</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amountPayingNow}
                        onChange={(e) => setAmountPayingNow(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="online">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Input
                        placeholder="Add any notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handlePayment}
                      disabled={loading || selectedStudents.size === 0}
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Record Payment
                    </Button>
                  </div>

                  {/* Transaction History */}
                  {transactionHistory.length > 0 && (
                    <div className="space-y-3 pt-6 border-t">
                      <h3 className="font-semibold">Recent Transactions</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {transactionHistory.map((txn) => (
                          <Card key={txn.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{txn.transaction_number}</p>
                                <p className="text-xs text-muted-foreground">{txn.description}</p>
                                <p className="text-xs text-muted-foreground">{new Date(txn.transaction_date).toLocaleDateString()}</p>
                                {txn.transaction_line_items && txn.transaction_line_items.length > 0 && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {txn.transaction_line_items.map((li, idx) => (
                                      <div key={idx}>• {li.description}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                {txn.transaction_type === 'charge' && (
                                  <p className="text-red-600 font-bold">+Rs. {Math.round(txn.amount)}</p>
                                )}
                                {txn.transaction_type === 'payment' && (
                                  <p className="text-green-600 font-bold">-Rs. {Math.round(txn.amount)}</p>
                                )}
                                {txn.payment_method && (
                                  <p className="text-xs text-muted-foreground capitalize">{txn.payment_method.replace('_', ' ')}</p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentSuccessDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        receiptData={receiptData}
      />
    </div>
  );
};

export default FeeCollection;
