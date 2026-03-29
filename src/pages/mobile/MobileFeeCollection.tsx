import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileContainer } from '@/components/mobile/MobileContainer';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav } from '@/components/mobile/MobileNav';
import { MobileCard } from '@/components/mobile/MobileCard';
import { MobileFormField } from '@/components/mobile/MobileFormField';
import { MobileStepIndicator } from '@/components/mobile/MobileStepIndicator';
import { MobileReceiptSheet } from '@/components/mobile/MobileReceiptSheet';
import { DesktopWarning } from '@/components/mobile/DesktopWarning';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, User } from 'lucide-react';

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
  netFee: number;
}

interface PaidMonth {
  student_id: string;
  month: string;
}

const MobileFeeCollection = () => {
  const { user } = useAuth();
  const { isDesktop } = useMobileDetect();
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPayingNow, setAmountPayingNow] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [paidMonths, setPaidMonths] = useState<PaidMonth[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  if (isDesktop) {
    return <DesktopWarning />;
  }

  const steps = [
    { label: 'Search', description: 'Find parent' },
    { label: 'Select', description: 'Choose students' },
    { label: 'Months', description: 'Pick months' },
    { label: 'Payment', description: 'Enter amount' },
  ];

  const getMonthWindow = () => {
    const result = [];
    const now = new Date();
    
    // Start from 3 months before current month
    for (let i = -3; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const shortYear = date.getFullYear().toString().slice(-2);
      const fullYear = date.getFullYear();
      const monthNumber = date.getMonth() + 1;
      
      result.push({
        display: `${date.toLocaleString('default', { month: 'short' })} ${shortYear}`,
        fullMonth: date.toLocaleString('default', { month: 'long' }),
        year: fullYear,
        monthNumber: monthNumber,
        key: `${fullYear}-${monthNumber.toString().padStart(2, '0')}`
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
      const { data: parentData, error } = await supabase
        .from('parents')
        .select('*')
        .or(`parent_id.ilike.%${sanitized}%,cnic.ilike.%${sanitized}%,father_name.ilike.%${sanitized}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(parentData || []);
      
      if (!parentData || parentData.length === 0) {
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
    
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parent.id)
      .eq('is_active', true);

    if (error) {
      toast.error('Failed to load students');
      return;
    }

    const studentsWithFees = (studentsData || []).map(s => ({
      ...s,
      netFee: s.monthly_fee // Simplified for mobile
    }));

    // Fetch paid months for these students (3 months before to 3 months after)
    const studentIds = studentsWithFees.map(s => s.id);
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const { data: paidData } = await supabase
      .from('fee_payments')
      .select('student_id, month')
      .in('student_id', studentIds)
      .gte('payment_year', threeMonthsAgo.getFullYear());
    
    setPaidMonths(paidData || []);
    setStudents(studentsWithFees);
    setCurrentStep(1);
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const isMonthPaid = (monthKey: string, studentId: string) => {
    const monthInfo = monthOptions.find(m => m.key === monthKey);
    if (!monthInfo) return false;
    
    const monthString = `${monthInfo.fullMonth} ${monthInfo.year}`;
    return paidMonths.some(pm => pm.student_id === studentId && pm.month === monthString);
  };

  const isMonthDisabled = (monthKey: string) => {
    // A month is disabled if ANY of the selected students has already paid for it
    return Array.from(selectedStudents).some(studentId => 
      isMonthPaid(monthKey, studentId)
    );
  };

  const toggleMonth = (monthKey: string) => {
    if (isMonthDisabled(monthKey)) {
      toast.error('This month is already paid for one or more selected students');
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

  const calculateTotal = () => {
    let currentAmount = students
      .filter(s => selectedStudents.has(s.id))
      .reduce((sum, s) => sum + (s.netFee * selectedMonths.size), 0);
    const totalDue = (selectedParent?.current_balance || 0) + currentAmount;
    return Math.round(totalDue);
  };

  const handlePayment = async () => {
    if (selectedStudents.size === 0 || selectedMonths.size === 0) {
      toast.error('Please select students and months');
      return;
    }
    
    if (!amountPayingNow || parseFloat(amountPayingNow) <= 0) {
      toast.error('Please enter the amount being paid');
      return;
    }

    setLoading(true);
    try {
      const cashReceived = parseFloat(amountPayingNow);
      let totalCharge = 0;
      const lineItems: any[] = [];
      
      for (const studentId of Array.from(selectedStudents)) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;
        
        for (const monthKey of Array.from(selectedMonths)) {
          const monthInfo = monthOptions.find(m => m.key === monthKey);
          if (!monthInfo) continue;
          
          totalCharge += student.netFee;
          lineItems.push({
            student_id: studentId,
            item_type: 'monthly_fee',
            month: `${monthInfo.fullMonth} ${monthInfo.year}`,
            amount: student.netFee,
            description: `${student.name} - ${monthInfo.display}`
          });
        }
      }
      
      const previousBalance = selectedParent!.current_balance;
      
      // Insert charge transaction
      const { data: charge, error: chargeError } = await supabase
        .from('parent_transactions')
        .insert({
          parent_id: selectedParent!.id,
          transaction_type: 'charge',
          amount: totalCharge,
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Charges for monthly fees',
          recorded_by: user?.id,
          notes: notes || null
        })
        .select()
        .single();
      
      if (chargeError) throw chargeError;
      
      const chargeTransactionNumber = charge.transaction_number || `TXN-${Date.now()}`;
      
      // Insert line items
      if (lineItems.length > 0) {
        await supabase
          .from('transaction_line_items')
          .insert(lineItems.map(li => ({
            ...li,
            transaction_id: charge.id
          })));
        
        // Calculate the total charges for proportional payment distribution
        const totalLineItemCharges = lineItems.reduce((sum, li) => sum + li.amount, 0);
        
        // Insert fee_payments with unique receipt numbers
        const feePaymentRecords = await Promise.all(
          lineItems.map(async (li) => {
            const student = students.find(s => s.id === li.student_id);
            
            // Extract year from month string (e.g., "January 2025" -> 2025)
            const year = parseInt(li.month.split(' ')[1]) || new Date().getFullYear();
            
            // Generate unique receipt number for each payment
            const { data: receiptNumber } = await supabase.rpc('generate_receipt_number');
            
            // Calculate proportional amount paid for this line item
            let proportionalAmountPaid = li.amount;
            if (cashReceived < totalCharge && totalLineItemCharges > 0) {
              // Distribute payment proportionally across line items
              proportionalAmountPaid = Math.round((li.amount / totalLineItemCharges) * Math.min(cashReceived, totalLineItemCharges));
            }
            
            return {
              parent_id: selectedParent!.id,
              student_id: li.student_id,
              month: li.month,
              payment_year: year,
              amount_paid: proportionalAmountPaid,
              payment_date: new Date().toISOString().split('T')[0],
              base_fee: student?.monthly_fee || 0,
              total_discount: 0,
              individual_discount: 0,
              sibling_discount: 0,
              net_amount: li.amount,
              receipt_number: receiptNumber,
              payment_method: paymentMethod,
              recorded_by: user?.id,
              notes: notes || null
            };
          })
        );
        
        await supabase.from('fee_payments').insert(feePaymentRecords);
      }
      
      // Insert payment transaction
      await supabase.from('parent_transactions').insert({
        parent_id: selectedParent!.id,
        transaction_type: 'payment',
        amount: cashReceived,
        payment_method: paymentMethod,
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Payment received via ${paymentMethod}`,
        recorded_by: user?.id,
        notes: notes || null
      });
      
      // Fetch updated parent balance
      const { data: updatedParent } = await supabase
        .from('parents')
        .select('current_balance')
        .eq('id', selectedParent!.id)
        .single();
      
      const newBalance = updatedParent?.current_balance ?? (previousBalance + totalCharge - cashReceived);
      
      // Prepare receipt data
      const receiptStudents = Array.from(selectedStudents).map(studentId => {
        const student = students.find(s => s.id === studentId);
        const totalFee = (student?.netFee || 0) * selectedMonths.size;
        return {
          name: student?.name || '',
          studentId: student?.student_id || '',
          amount: totalFee,
          description: `${selectedMonths.size} month(s) fee`
        };
      });

      const displayMonths = Array.from(selectedMonths).map(key => {
        const monthInfo = monthOptions.find(m => m.key === key);
        return monthInfo?.display || key;
      });

      setReceiptData({
        transactionNumber: chargeTransactionNumber,
        parentName: selectedParent!.father_name,
        parentId: selectedParent!.parent_id,
        phone: selectedParent!.phone,
        previousBalance: previousBalance,
        totalCharged: totalCharge,
        cashReceived: cashReceived,
        newBalance: newBalance,
        students: receiptStudents,
        paymentDate: new Date().toLocaleDateString(),
        paymentMethod: paymentMethod,
        notes: notes,
        months: displayMonths
      });
      
      toast.success('Fee collected successfully! View receipt below.');
      setShowReceipt(true);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptClose = (open: boolean) => {
    setShowReceipt(open);
    if (!open) {
      // Reset form when receipt is closed
      setCurrentStep(0);
      setSelectedParent(null);
      setSelectedStudents(new Set());
      setSelectedMonths(new Set());
      setAmountPayingNow('');
      setNotes('');
      setSearchQuery('');
      setPaidMonths([]);
    }
  };

  return (
    <MobileContainer>
      <MobileHeader title="Collect Fee" className="bg-blue-600 text-white border-blue-700" />
      
      <MobileStepIndicator steps={steps} currentStep={currentStep} />

      <div className="p-4 space-y-4 pb-24">
        {/* Step 0: Search Parent */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <MobileFormField label="Search Parent" required>
              <div className="flex gap-2">
                <Input
                  placeholder="Name, CNIC, or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 text-base"
                  onKeyDown={(e) => e.key === 'Enter' && searchParents()}
                />
                <Button onClick={searchParents} className="h-12 px-6" disabled={loading}>
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </MobileFormField>

            <div className="space-y-2">
              {searchResults.map((parent) => (
                <MobileCard key={parent.id} onClick={() => selectParent(parent)}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{parent.father_name}</p>
                      <p className="text-sm text-muted-foreground">{parent.parent_id}</p>
                      <p className="text-xs text-muted-foreground">{parent.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${parent.current_balance > 0 ? 'text-destructive' : 'text-success'}`}>
                        Rs. {parent.current_balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Balance</p>
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Select Students */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">{selectedParent?.father_name}</p>
              <p className="text-xs text-muted-foreground">{selectedParent?.parent_id}</p>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <MobileCard 
                  key={student.id} 
                  onClick={() => toggleStudent(student.id)}
                  active={selectedStudents.has(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs. {student.netFee}</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>

            <Button 
              className="w-full h-12" 
              onClick={() => setCurrentStep(2)}
              disabled={selectedStudents.size === 0}
            >
              Continue ({selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''})
            </Button>
          </div>
        )}

        {/* Step 2: Select Months */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {monthOptions.map((month) => {
                const disabled = isMonthDisabled(month.key);
                return (
                  <MobileCard 
                    key={month.key}
                    onClick={() => !disabled && toggleMonth(month.key)}
                    active={selectedMonths.has(month.key)}
                    className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedMonths.has(month.key)}
                        onCheckedChange={() => !disabled && toggleMonth(month.key)}
                        disabled={disabled}
                      />
                      <div>
                        <p className={`font-medium ${disabled ? 'text-muted-foreground' : ''}`}>
                          {month.display}
                        </p>
                        {disabled && (
                          <p className="text-xs text-muted-foreground">Already paid</p>
                        )}
                      </div>
                    </div>
                  </MobileCard>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12" 
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 h-12" 
                onClick={() => setCurrentStep(3)}
                disabled={selectedMonths.size === 0}
              >
                Continue ({selectedMonths.size} month{selectedMonths.size !== 1 ? 's' : ''})
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Due</p>
              <p className="text-2xl font-bold">Rs. {calculateTotal().toLocaleString()}</p>
            </div>

            <MobileFormField label="Payment Method" required>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </MobileFormField>

            <MobileFormField label="Amount Paying Now" required>
              <Input
                type="number"
                placeholder="0"
                value={amountPayingNow}
                onChange={(e) => setAmountPayingNow(e.target.value)}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Notes (Optional)">
              <Textarea
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-base"
              />
            </MobileFormField>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12" 
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 h-12" 
                onClick={handlePayment}
                disabled={loading || !amountPayingNow}
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <MobileReceiptSheet
        open={showReceipt}
        onOpenChange={handleReceiptClose}
        receiptData={receiptData}
      />

      <MobileNav />
    </MobileContainer>
  );
};

export default MobileFeeCollection;
