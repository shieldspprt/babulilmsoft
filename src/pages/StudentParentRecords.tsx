import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Users, 
  UserCircle, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  CreditCard, 
  Edit, 
  GraduationCap,
  Filter,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Percent,
  Tag
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatDate, formatCnic, parseCnic } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Parent {
  id: string;
  parent_id: string;
  father_name: string;
  cnic: string;
  phone: string;
  phone_secondary: string | null;
  address: string | null;
  current_balance: number;
  total_charged: number;
  total_paid: number;
  created_at: string;
  students?: { count: number }[];
  is_active?: boolean;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  date_of_birth: string;
  date_of_admission: string;
  roll_number: string | null;
  monthly_fee: number;
  parent_id: string;
  is_active: boolean;
  cnic: string | null;
  parent?: {
    id: string;
    father_name: string;
    phone: string;
    phone_secondary: string | null;
    address: string | null;
    cnic: string;
  };
}

interface Concession {
  id: string;
  discount_type: string;
  discount_value: number;
  valid_from?: string;
  valid_until?: string;
  notes?: string;
  category_id: string;
  category: { name: string; description?: string };
}

interface DetailedStudent extends Student {
  concessions?: Concession[];
  sibling_discount?: number;
}

interface ConcessionCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: string;
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string | null;
}

interface ClassOption {
  id: string;
  name: string;
  monthly_fee: number;
}

// Unified record type for list display
interface ListRecord {
  id: string;
  displayId: string;
  name: string;
  subtitle: string;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  amount: number;
  amountLabel: string;
  isActive: boolean;
  type: 'student' | 'parent';
  original: Student | Parent;
}

const StudentParentRecords = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdminOrUser, isAdmin, loading: roleLoading } = useUserRole(user?.id);
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'parents' | 'students'>('students');
  const [searchQuery, setSearchQuery] = useState("");
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ListRecord | null>(null);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<DetailedStudent | null>(null);
  const [detailedStudents, setDetailedStudents] = useState<DetailedStudent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Unified filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Edit parent dialog state
  const [isEditParentDialogOpen, setIsEditParentDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [editParentFormData, setEditParentFormData] = useState({
    fatherName: '',
    phone: '',
    phoneSecondary: '',
    address: '',
  });
  const [editParentLoading, setEditParentLoading] = useState(false);

  // Edit student dialog state
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentFormData, setEditStudentFormData] = useState({
    name: '',
    dateOfBirth: '',
    dateOfAdmission: '',
    cnic: '',
    rollNumber: '',
    className: '',
    fatherName: '',
    phone: '',
    phoneSecondary: '',
    address: '',
  });
  const [editStudentLoading, setEditStudentLoading] = useState(false);

  // Delete/toggle status dialog state
  const [isDeleteParentDialogOpen, setIsDeleteParentDialogOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [isToggleStatusDialogOpen, setIsToggleStatusDialogOpen] = useState(false);
  const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);

  // Discount management state
  const [concessionCategories, setConcessionCategories] = useState<ConcessionCategory[]>([]);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Concession | null>(null);
  const [discountFormData, setDiscountFormData] = useState({
    category_id: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    valid_from: '',
    valid_until: '',
    notes: '',
  });
  const [discountLoading, setDiscountLoading] = useState(false);
  const [isDeleteDiscountDialogOpen, setIsDeleteDiscountDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<Concession | null>(null);

  useEffect(() => {
    loadClasses();
    loadConcessionCategories();
  }, []);

  useEffect(() => {
    if (isAdminOrUser) {
      fetchData();
    }
  }, [isAdminOrUser, activeView, selectedClass, statusFilter]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, monthly_fee')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadConcessionCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('concession_categories')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setConcessionCategories(data || []);
    } catch (error) {
      console.error('Failed to load concession categories:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeView === 'parents') {
        let query = supabase
          .from('parents')
          .select(`
            *,
            students:students(count)
          `)
          .order('father_name');

        const { data: parentsData, error: parentsError } = await query;

        if (parentsError) throw parentsError;
        
        // Filter parents based on their students' status and class
        let filteredParents = parentsData || [];
        
        if (selectedClass !== 'all' || statusFilter !== 'all') {
          // Fetch students to filter parents
          let studentsQuery = supabase
            .from('students')
            .select('parent_id, class, is_active');
          
          if (selectedClass !== 'all') {
            studentsQuery = studentsQuery.eq('class', selectedClass);
          }
          
          if (statusFilter === 'active') {
            studentsQuery = studentsQuery.eq('is_active', true);
          } else if (statusFilter === 'inactive') {
            studentsQuery = studentsQuery.eq('is_active', false);
          }
          
          const { data: studentsData } = await studentsQuery;
          
          if (studentsData) {
            const parentIds = new Set(studentsData.map(s => s.parent_id));
            filteredParents = filteredParents.filter(p => parentIds.has(p.id));
          }
        }
        
        setParents(filteredParents);
      } else if (activeView === 'students') {
        let query = supabase
          .from('students')
          .select(`
            *,
            parent:parents(id, father_name, phone, phone_secondary, address, cnic)
          `)
          .order('name');

        if (selectedClass && selectedClass !== 'all') {
          query = query.eq('class', selectedClass);
        }

        if (statusFilter === 'active') {
          query = query.eq('is_active', true);
        } else if (statusFilter === 'inactive') {
          query = query.eq('is_active', false);
        }

        const { data: studentsData, error: studentsError } = await query;

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-destructive";
    if (balance < 0) return "text-green-600";
    return "text-muted-foreground";
  };

  // Convert data to unified list records
  const listRecords = useMemo((): ListRecord[] => {
    if (activeView === 'students') {
      return students.map((student): ListRecord => ({
        id: student.id,
        displayId: student.student_id,
        name: student.name,
        subtitle: `Class: ${student.class}`,
        badge: student.is_active ? 'Active' : 'Inactive',
        badgeVariant: student.is_active ? 'default' : 'secondary',
        amount: student.monthly_fee,
        amountLabel: 'Monthly Fee',
        isActive: student.is_active,
        type: 'student',
        original: student,
      }));
    } else {
      return parents.map((parent): ListRecord => ({
        id: parent.id,
        displayId: parent.parent_id,
        name: parent.father_name,
        subtitle: parent.phone,
        badge: `${parent.students?.[0]?.count || 0} student(s)`,
        badgeVariant: 'secondary',
        amount: parent.current_balance || 0,
        amountLabel: 'Balance',
        isActive: true,
        type: 'parent',
        original: parent,
      }));
    }
  }, [activeView, students, parents]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return listRecords;
    const query = searchQuery.toLowerCase();
    return listRecords.filter(
      (record) =>
        record.name.toLowerCase().includes(query) ||
        record.displayId.toLowerCase().includes(query) ||
        record.subtitle.toLowerCase().includes(query)
    );
  }, [listRecords, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (activeView === 'students') {
      return {
        total: students.length,
        active: students.filter(s => s.is_active).length,
        inactive: students.filter(s => !s.is_active).length,
      };
    } else {
      const totalBalance = parents.reduce((sum, p) => sum + (p.current_balance || 0), 0);
      return {
        total: parents.length,
        active: parents.length,
        inactive: 0,
        totalBalance,
      };
    }
  }, [activeView, students, parents]);

  const fetchParentDetails = async (parent: Parent) => {
    setDetailLoading(true);
    setSelectedParent(parent);
    setSelectedStudent(null);
    
    try {
      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select(`
          *,
          concessions:student_concessions(
            id,
            category_id,
            discount_type,
            discount_value,
            valid_from,
            valid_until,
            notes,
            category:concession_categories(name, description)
          )
        `)
        .eq('parent_id', parent.id)
        .order('name');

      if (childrenError) throw childrenError;

      const childrenWithDiscounts = childrenData?.map((child) => ({
        ...child,
        sibling_discount: 0,
      })) || [];

      setDetailedStudents(childrenWithDiscounts);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('parent_transactions')
        .select('*')
        .eq('parent_id', parent.id)
        .order('transaction_date', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching parent details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchStudentDetails = async (student: Student) => {
    setDetailLoading(true);
    setSelectedStudent(null);
    setSelectedParent(null);
    
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          parent:parents(*),
          concessions:student_concessions(
            id,
            category_id,
            discount_type,
            discount_value,
            valid_from,
            valid_until,
            notes,
            category:concession_categories(name, description)
          )
        `)
        .eq('id', student.id)
        .single();

      if (studentError) throw studentError;
      setSelectedStudent(studentData);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', student.id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;
      setTransactions(paymentsData?.map(p => ({
        id: p.id,
        transaction_number: p.receipt_number,
        transaction_type: 'payment',
        amount: p.amount_paid,
        description: `Fee Payment - ${p.month}`,
        transaction_date: p.payment_date || '',
        payment_method: p.payment_method,
      })) || []);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRecordClick = (record: ListRecord) => {
    setSelectedRecord(record);
    if (record.type === 'student') {
      fetchStudentDetails(record.original as Student);
    } else {
      fetchParentDetails(record.original as Parent);
    }
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
    setSelectedParent(null);
    setSelectedStudent(null);
    setDetailedStudents([]);
    setTransactions([]);
  };

  const handleViewChange = (view: 'students' | 'parents') => {
    setActiveView(view);
    handleBackToList();
    setSearchQuery('');
  };

  // Edit parent handlers
  const handleEditParentClick = (parent: Parent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingParent(parent);
    setEditParentFormData({
      fatherName: parent.father_name,
      phone: parent.phone,
      phoneSecondary: parent.phone_secondary || '',
      address: parent.address || '',
    });
    setIsEditParentDialogOpen(true);
  };

  const handleEditParentSubmit = async () => {
    if (!editingParent) return;
    
    setEditParentLoading(true);
    try {
      const { error } = await supabase
        .from('parents')
        .update({
          father_name: editParentFormData.fatherName,
          phone: editParentFormData.phone,
          phone_secondary: editParentFormData.phoneSecondary || null,
          address: editParentFormData.address || null,
        })
        .eq('id', editingParent.id);

      if (error) throw error;

      toast.success('Parent updated successfully');
      setIsEditParentDialogOpen(false);
      setEditingParent(null);
      fetchData();
      
      if (selectedParent?.id === editingParent.id) {
        fetchParentDetails({ ...selectedParent, ...editParentFormData } as Parent);
      }
    } catch (error) {
      console.error('Failed to update parent:', error);
      toast.error('Failed to update parent');
    } finally {
      setEditParentLoading(false);
    }
  };

  // Delete parent handlers
  const handleDeleteParentClick = (parent: Parent, e: React.MouseEvent) => {
    e.stopPropagation();
    setParentToDelete(parent);
    setIsDeleteParentDialogOpen(true);
  };

  const handleDeleteParent = async () => {
    if (!parentToDelete) return;

    try {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parentToDelete.id)
        .eq('is_active', true);

      if (count && count > 0) {
        toast.error('Cannot delete parent with active students. Please deactivate all students first.');
        setIsDeleteParentDialogOpen(false);
        setParentToDelete(null);
        return;
      }

      await supabase
        .from('students')
        .update({ is_active: false })
        .eq('parent_id', parentToDelete.id);

      toast.success('Parent record processed successfully');
      setIsDeleteParentDialogOpen(false);
      setParentToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Failed to process parent:', error);
      toast.error('Failed to process parent record');
    }
  };

  // Edit student handlers
  const handleEditStudentClick = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingStudent(student);
    setEditStudentFormData({
      name: student.name,
      dateOfBirth: student.date_of_birth,
      dateOfAdmission: student.date_of_admission,
      cnic: student.cnic || '',
      rollNumber: student.roll_number || '',
      className: student.class,
      fatherName: student.parent?.father_name || '',
      phone: student.parent?.phone || '',
      phoneSecondary: student.parent?.phone_secondary || '',
      address: student.parent?.address || '',
    });
    setIsEditStudentDialogOpen(true);
  };

  const handleEditStudentSubmit = async () => {
    if (!editingStudent) return;
    
    setEditStudentLoading(true);
    try {
      const classData = classes.find(c => c.name === editStudentFormData.className);
      const monthlyFee = classData?.monthly_fee || editingStudent.monthly_fee;

      const { error: studentError } = await supabase
        .from('students')
        .update({
          name: editStudentFormData.name,
          date_of_birth: editStudentFormData.dateOfBirth,
          date_of_admission: editStudentFormData.dateOfAdmission,
          cnic: editStudentFormData.cnic || null,
          roll_number: editStudentFormData.rollNumber || null,
          class: editStudentFormData.className,
          monthly_fee: monthlyFee,
        })
        .eq('id', editingStudent.id);

      if (studentError) throw studentError;

      if (editingStudent.parent?.id) {
        const { error: parentError } = await supabase
          .from('parents')
          .update({
            father_name: editStudentFormData.fatherName,
            phone: editStudentFormData.phone,
            phone_secondary: editStudentFormData.phoneSecondary || null,
            address: editStudentFormData.address || null,
          })
          .eq('id', editingStudent.parent.id);

        if (parentError) throw parentError;
      }

      toast.success('Student updated successfully');
      setIsEditStudentDialogOpen(false);
      setEditingStudent(null);
      fetchData();
      
      if (selectedStudent?.id === editingStudent.id) {
        fetchStudentDetails(editingStudent);
      }
    } catch (error) {
      console.error('Failed to update student:', error);
      toast.error('Failed to update student');
    } finally {
      setEditStudentLoading(false);
    }
  };

  // Toggle student status handlers
  const handleToggleStatusClick = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStudentToToggle(student);
    setIsToggleStatusDialogOpen(true);
  };

  const handleToggleStudentStatus = async () => {
    if (!studentToToggle) return;

    try {
      const { error } = await supabase
        .from('students')
        .update({ is_active: !studentToToggle.is_active })
        .eq('id', studentToToggle.id);

      if (error) throw error;

      toast.success(
        studentToToggle.is_active
          ? 'Student marked as inactive'
          : 'Student reactivated'
      );
      setIsToggleStatusDialogOpen(false);
      setStudentToToggle(null);
      fetchData();
      
      if (selectedStudent?.id === studentToToggle.id) {
        fetchStudentDetails(studentToToggle);
      }
    } catch (error) {
      console.error('Failed to update student status:', error);
      toast.error('Failed to update student status');
    }
  };

  // Discount management handlers
  const handleAddDiscountClick = () => {
    setEditingDiscount(null);
    setDiscountFormData({
      category_id: '',
      discount_type: 'percentage',
      discount_value: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      notes: '',
    });
    setIsDiscountDialogOpen(true);
  };

  const handleEditDiscountClick = (discount: Concession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDiscount(discount);
    setDiscountFormData({
      category_id: discount.category_id,
      discount_type: discount.discount_type as 'percentage' | 'fixed_amount',
      discount_value: discount.discount_value.toString(),
      valid_from: discount.valid_from || '',
      valid_until: discount.valid_until || '',
      notes: discount.notes || '',
    });
    setIsDiscountDialogOpen(true);
  };

  const handleDeleteDiscountClick = (discount: Concession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDiscountToDelete(discount);
    setIsDeleteDiscountDialogOpen(true);
  };

  const calculateAndUpdateMonthlyFee = async (studentId: string) => {
    try {
      // Fetch student's base_fee
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('base_fee, monthly_fee')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const baseFee = studentData.base_fee || studentData.monthly_fee;

      // Fetch all active concessions for this student
      const { data: concessions, error: concessionsError } = await supabase
        .from('student_concessions')
        .select('discount_type, discount_value, valid_until')
        .eq('student_id', studentId);

      if (concessionsError) throw concessionsError;

      // Calculate total discount
      let totalDiscount = 0;
      const today = new Date().toISOString().split('T')[0];

      (concessions || []).forEach((concession) => {
        // Skip expired concessions
        if (concession.valid_until && concession.valid_until < today) {
          return;
        }

        if (concession.discount_type === 'percentage') {
          totalDiscount += baseFee * (concession.discount_value / 100);
        } else if (concession.discount_type === 'fixed_amount') {
          totalDiscount += concession.discount_value;
        }
      });

      // Calculate new monthly fee (ensure it doesn't go below 0)
      const newMonthlyFee = Math.max(0, baseFee - totalDiscount);

      // Update the student's monthly_fee
      const { error: updateError } = await supabase
        .from('students')
        .update({ monthly_fee: newMonthlyFee })
        .eq('id', studentId);

      if (updateError) throw updateError;

      return newMonthlyFee;
    } catch (error) {
      console.error('Failed to recalculate monthly fee:', error);
      throw error;
    }
  };

  const handleDiscountSubmit = async () => {
    if (!selectedStudent || !discountFormData.category_id || !discountFormData.discount_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    setDiscountLoading(true);
    try {
      const discountData = {
        student_id: selectedStudent.id,
        category_id: discountFormData.category_id,
        discount_type: discountFormData.discount_type,
        discount_value: parseFloat(discountFormData.discount_value),
        valid_from: discountFormData.valid_from || null,
        valid_until: discountFormData.valid_until || null,
        notes: discountFormData.notes || null,
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from('student_concessions')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_concessions')
          .insert(discountData);

        if (error) throw error;
      }

      // Recalculate and update monthly fee
      const newMonthlyFee = await calculateAndUpdateMonthlyFee(selectedStudent.id);

      toast.success(
        editingDiscount 
          ? `Discount updated. Monthly fee is now Rs. ${newMonthlyFee.toLocaleString()}`
          : `Discount added. Monthly fee is now Rs. ${newMonthlyFee.toLocaleString()}`
      );

      setIsDiscountDialogOpen(false);
      setEditingDiscount(null);
      
      // Refresh student details and list
      fetchData();
      const studentToRefresh = students.find(s => s.id === selectedStudent.id) || selectedStudent;
      fetchStudentDetails(studentToRefresh);
    } catch (error: any) {
      console.error('Failed to save discount:', error);
      if (error?.message?.includes('more than 2 discount categories')) {
        toast.error('A student cannot have more than 2 discount categories');
      } else {
        toast.error('Failed to save discount');
      }
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleDeleteDiscount = async () => {
    if (!discountToDelete || !selectedStudent) return;

    try {
      const { error } = await supabase
        .from('student_concessions')
        .delete()
        .eq('id', discountToDelete.id);

      if (error) throw error;

      // Recalculate and update monthly fee after deletion
      const newMonthlyFee = await calculateAndUpdateMonthlyFee(selectedStudent.id);

      toast.success(`Discount deleted. Monthly fee is now Rs. ${newMonthlyFee.toLocaleString()}`);
      setIsDeleteDiscountDialogOpen(false);
      setDiscountToDelete(null);

      // Refresh student details and list
      fetchData();
      const studentToRefresh = students.find(s => s.id === selectedStudent.id) || selectedStudent;
      fetchStudentDetails(studentToRefresh);
    } catch (error) {
      console.error('Failed to delete discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdminOrUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Page Header */}
      <div className="container mx-auto px-4 pt-24 pb-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold">Student & Parent Records</h1>
              <p className="text-muted-foreground">
                View and manage all student and parent information
              </p>
            </div>
          
          {/* Toggle Buttons */}
          <div className="flex gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={activeView === 'students' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('students')}
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Students
            </Button>
            <Button
              variant={activeView === 'parents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('parents')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Parents
            </Button>
          </div>
          </div>
        </div>

        {/* Unified Filters - Always visible */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedClass('all');
                  setStatusFilter('active');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
              <div className="flex-1" />
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">Showing: <strong>{filteredRecords.length}</strong></span>
                {activeView === 'students' && (
                  <>
                    <span className="text-green-600">Active: <strong>{stats.active}</strong></span>
                    <span className="text-muted-foreground">Inactive: <strong>{stats.inactive}</strong></span>
                  </>
                )}
                {activeView === 'parents' && (
                  <span className="text-muted-foreground">Total Parents: <strong>{stats.total}</strong></span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Split Panel Layout */}
        <div className="flex gap-4 min-h-[calc(100vh-300px)]">
          {/* Left Panel - Unified List */}
          <div className="w-[400px] flex-shrink-0 flex flex-col border rounded-lg bg-card">
            <div className="p-4 border-b">
              <Input
                placeholder={`Search ${activeView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="divide-y">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      No {activeView} found
                    </div>
                  ) : (
                    filteredRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedRecord?.id === record.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleRecordClick(record)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{record.name}</p>
                            <p className="text-sm text-muted-foreground">{record.displayId}</p>
                            <p className="text-xs text-muted-foreground">{record.subtitle}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-bold ${
                              record.type === 'parent' ? getBalanceColor(record.amount) : ''
                            }`}>
                              Rs. {record.amount.toLocaleString()}
                            </p>
                            <Badge variant={record.badgeVariant} className="text-xs mt-1">
                              {record.badge}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
            {!loading && (
              <div className="p-3 border-t text-sm text-muted-foreground text-center">
                {filteredRecords.length} {activeView}
              </div>
            )}
          </div>

          {/* Right Panel - Unified Details */}
          <div className="flex-1 border rounded-lg bg-card overflow-hidden">
            <ScrollArea className="h-full">
              {!selectedRecord && !selectedParent && !selectedStudent ? (
                <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <UserCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a Record</p>
                    <p className="text-sm">Click on a {activeView === 'students' ? 'student' : 'parent'} from the list to view details</p>
                  </div>
                </div>
              ) : detailLoading ? (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedStudent ? (
                // Student Detail View
                <div className="p-6">
                  {/* Profile Card */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <span>{selectedStudent.name}</span>
                            <Badge variant="outline">{selectedStudent.student_id}</Badge>
                            <Badge variant={selectedStudent.is_active ? "default" : "secondary"}>
                              {selectedStudent.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>Student Profile & Academic Information</CardDescription>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleEditStudentClick(selectedStudent, e)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant={selectedStudent.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={(e) => handleToggleStatusClick(selectedStudent, e)}
                            >
                              {selectedStudent.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Reactivate
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Class:</span>
                            <p className="text-lg font-semibold">{selectedStudent.class}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Roll Number:</span>
                            <p>{selectedStudent.roll_number || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Date of Birth:</span>
                            <p>{formatDate(selectedStudent.date_of_birth)}</p>
                            <p className="text-sm text-muted-foreground">Age: {calculateAge(selectedStudent.date_of_birth)} years</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Admission Date:</span>
                            <p>{formatDate(selectedStudent.date_of_admission)}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Father Name:</span>
                            <p className="font-semibold">{(selectedStudent as any).parent?.father_name}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Contact:</span>
                            <p>{(selectedStudent as any).parent?.phone}</p>
                          </div>
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground">Base Monthly Fee:</span>
                            <p className="text-2xl font-bold text-primary">Rs. {selectedStudent.monthly_fee.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discounts Card - Always show with CRUD */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          Discounts & Concessions
                        </CardTitle>
                        {isAdmin && (
                          <Button size="sm" onClick={handleAddDiscountClick}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Discount
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!selectedStudent.concessions || selectedStudent.concessions.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Percent className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No discounts applied to this student</p>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={handleAddDiscountClick}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Discount
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedStudent.concessions.map((concession) => (
                            <div key={concession.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex-1">
                                <p className="font-semibold">{concession.category.name}</p>
                                <p className="text-sm text-muted-foreground">{concession.category.description || 'No description'}</p>
                                {concession.valid_from && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Valid from {formatDate(concession.valid_from)}
                                    {concession.valid_until && ` to ${formatDate(concession.valid_until)}`}
                                  </p>
                                )}
                                {concession.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">Note: {concession.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-green-600">
                                  {concession.discount_type === 'percentage' 
                                    ? `${concession.discount_value}%` 
                                    : `Rs. ${concession.discount_value.toLocaleString()}`}
                                </Badge>
                                {isAdmin && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => handleEditDiscountClick(concession, e)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={(e) => handleDeleteDiscountClick(concession, e)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Transaction History Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Fee Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt #</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No payment history found
                              </TableCell>
                            </TableRow>
                          ) : (
                            transactions.map((txn) => (
                              <TableRow key={txn.id}>
                                <TableCell>{formatDate(txn.transaction_date)}</TableCell>
                                <TableCell className="font-mono text-sm">{txn.transaction_number}</TableCell>
                                <TableCell>{txn.description}</TableCell>
                                <TableCell>{txn.payment_method || 'N/A'}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                  Rs. {txn.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : selectedParent ? (
                // Parent Detail View
                <div className="p-6">
                  {/* Profile Card */}
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <span>{selectedParent.father_name}</span>
                            <Badge variant="outline">{selectedParent.parent_id}</Badge>
                          </CardTitle>
                          <CardDescription>Parent Profile & Financial Summary</CardDescription>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleEditParentClick(selectedParent, e)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">CNIC:</span>
                            <span className="text-sm">{formatCnic(selectedParent.cnic)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Phone:</span>
                            <span className="text-sm">{selectedParent.phone}</span>
                          </div>
                          {selectedParent.phone_secondary && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Secondary:</span>
                              <span className="text-sm">{selectedParent.phone_secondary}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm font-medium">Address:</span>
                            <span className="text-sm">{selectedParent.address || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Total Charged:</span>
                            <span className="font-semibold">Rs. {selectedParent.total_charged.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Total Paid:</span>
                            <span className="font-semibold">Rs. {selectedParent.total_paid.toLocaleString()}</span>
                          </div>
                          <div className={`flex justify-between items-center p-3 rounded-lg ${
                            selectedParent.current_balance > 0 ? 'bg-destructive/10' : 
                            selectedParent.current_balance < 0 ? 'bg-green-100' : 'bg-muted'
                          }`}>
                            <span className="text-sm font-medium">Current Balance:</span>
                            <span className={`text-lg font-bold ${getBalanceColor(selectedParent.current_balance || 0)}`}>
                              Rs. {(selectedParent.current_balance || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Children Card */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Children ({detailedStudents.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detailedStudents.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No students found</p>
                      ) : (
                        <div className="space-y-3">
                          {detailedStudents.map((child) => (
                            <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <p className="font-semibold">{child.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {child.student_id} | Class: {child.class}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={child.is_active ? "default" : "secondary"}>
                                  {child.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <p className="text-sm font-semibold mt-1">
                                  Rs. {child.monthly_fee.toLocaleString()}/mo
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Transaction History Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction #</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No transactions found
                              </TableCell>
                            </TableRow>
                          ) : (
                            transactions.map((txn) => (
                              <TableRow key={txn.id}>
                                <TableCell>{formatDate(txn.transaction_date)}</TableCell>
                                <TableCell className="font-mono text-sm">{txn.transaction_number}</TableCell>
                                <TableCell>
                                  <Badge variant={txn.transaction_type === 'payment' ? 'default' : 'secondary'}>
                                    {txn.transaction_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{txn.description}</TableCell>
                                <TableCell>{txn.payment_method || 'N/A'}</TableCell>
                                <TableCell className={`text-right font-semibold ${
                                  txn.transaction_type === 'payment' ? 'text-green-600' : 'text-destructive'
                                }`}>
                                  {txn.transaction_type === 'payment' ? '-' : '+'} Rs. {txn.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </ScrollArea>
          </div>
        </div>

        {/* Edit Parent Dialog */}
        <Dialog open={isEditParentDialogOpen} onOpenChange={setIsEditParentDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Parent - {editingParent?.parent_id}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-father-name">Father's Name *</Label>
                <Input
                  id="edit-father-name"
                  value={editParentFormData.fatherName}
                  onChange={(e) => setEditParentFormData({ ...editParentFormData, fatherName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent-phone">Primary Phone *</Label>
                <Input
                  id="edit-parent-phone"
                  value={editParentFormData.phone}
                  onChange={(e) => setEditParentFormData({ ...editParentFormData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent-phone2">Secondary Phone</Label>
                <Input
                  id="edit-parent-phone2"
                  value={editParentFormData.phoneSecondary}
                  onChange={(e) => setEditParentFormData({ ...editParentFormData, phoneSecondary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent-address">Address</Label>
                <Textarea
                  id="edit-parent-address"
                  value={editParentFormData.address}
                  onChange={(e) => setEditParentFormData({ ...editParentFormData, address: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditParentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditParentSubmit} disabled={editParentLoading}>
                {editParentLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student - {editingStudent?.student_id}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={editStudentFormData.name}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dob">Date of Birth *</Label>
                    <Input
                      id="edit-dob"
                      type="date"
                      value={editStudentFormData.dateOfBirth}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-doa">Date of Admission *</Label>
                    <Input
                      id="edit-doa"
                      type="date"
                      value={editStudentFormData.dateOfAdmission}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, dateOfAdmission: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-class">Class *</Label>
                    <Select
                      value={editStudentFormData.className}
                      onValueChange={(value) => setEditStudentFormData({ ...editStudentFormData, className: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.name}>
                            {cls.name} - Rs. {cls.monthly_fee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cnic">Student CNIC</Label>
                    <Input
                      id="edit-cnic"
                      value={formatCnic(editStudentFormData.cnic)}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, cnic: parseCnic(e.target.value) })}
                      placeholder="xxxxx-xxxxxxx-x"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-roll">Roll Number</Label>
                    <Input
                      id="edit-roll"
                      value={editStudentFormData.rollNumber}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, rollNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Parent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-father">Father's Name *</Label>
                    <Input
                      id="edit-father"
                      value={editStudentFormData.fatherName}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, fatherName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Primary Phone *</Label>
                    <Input
                      id="edit-phone"
                      value={editStudentFormData.phone}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone2">Secondary Phone</Label>
                    <Input
                      id="edit-phone2"
                      value={editStudentFormData.phoneSecondary}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, phoneSecondary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      value={editStudentFormData.address}
                      onChange={(e) => setEditStudentFormData({ ...editStudentFormData, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditStudentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditStudentSubmit} disabled={editStudentLoading}>
                {editStudentLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Parent Confirmation Dialog */}
        <AlertDialog open={isDeleteParentDialogOpen} onOpenChange={setIsDeleteParentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Process Parent Record</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate all students associated with this parent. The parent record will be kept for historical purposes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteParent}>
                Proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle Student Status Confirmation Dialog */}
        <AlertDialog open={isToggleStatusDialogOpen} onOpenChange={setIsToggleStatusDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {studentToToggle?.is_active ? 'Deactivate Student' : 'Reactivate Student'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {studentToToggle?.is_active
                  ? `Are you sure you want to deactivate ${studentToToggle?.name}? They will no longer appear in active student lists.`
                  : `Are you sure you want to reactivate ${studentToToggle?.name}? They will be added back to active student lists.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleToggleStudentStatus}>
                {studentToToggle?.is_active ? 'Deactivate' : 'Reactivate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Discount Dialog */}
        <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? 'Edit Discount' : 'Add Discount'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="discount-category">Discount Category *</Label>
                <Select
                  value={discountFormData.category_id}
                  onValueChange={(value) => setDiscountFormData({ ...discountFormData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {concessionCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Discount Type *</Label>
                  <Select
                    value={discountFormData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed_amount') => 
                      setDiscountFormData({ ...discountFormData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount (Rs.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {discountFormData.discount_type === 'percentage' ? 'Percentage' : 'Amount'} *
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    min="0"
                    max={discountFormData.discount_type === 'percentage' ? '100' : undefined}
                    value={discountFormData.discount_value}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, discount_value: e.target.value })}
                    placeholder={discountFormData.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid-from">Valid From</Label>
                  <Input
                    id="valid-from"
                    type="date"
                    value={discountFormData.valid_from}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, valid_from: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid Until (Optional)</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={discountFormData.valid_until}
                    onChange={(e) => setDiscountFormData({ ...discountFormData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-notes">Notes (Optional)</Label>
                <Textarea
                  id="discount-notes"
                  value={discountFormData.notes}
                  onChange={(e) => setDiscountFormData({ ...discountFormData, notes: e.target.value })}
                  placeholder="Any additional notes about this discount..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDiscountSubmit} disabled={discountLoading}>
                {discountLoading ? 'Saving...' : editingDiscount ? 'Update Discount' : 'Add Discount'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Discount Confirmation Dialog */}
        <AlertDialog open={isDeleteDiscountDialogOpen} onOpenChange={setIsDeleteDiscountDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Discount</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the "{discountToDelete?.category.name}" discount? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDiscount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Discount
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default StudentParentRecords;
