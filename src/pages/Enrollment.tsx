import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { formatCnic, parseCnic } from '@/lib/utils';

const enrollmentSchema = z.object({
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  dateOfAdmission: z.string().min(1, 'Date of admission is required'),
  fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
  parentCnic: z.string().refine((val) => parseCnic(val).length === 13, 'CNIC must be exactly 13 digits'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  className: z.string().min(1, 'Please select a class'),
});

const Enrollment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [monthlyFee, setMonthlyFee] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!formRef.current) return;
    
    try {
      toast.loading('Generating PDF...');
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('student-enrollment-form.pdf');
      toast.dismiss();
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };
  
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: '',
    dateOfAdmission: new Date().toISOString().split('T')[0],
    studentCnic: '',
    fatherName: '',
    parentCnic: '',
    phone: '',
    phoneSecondary: '',
    address: '',
    className: '',
    discount1Category: '',
    discount1Type: 'percentage',
    discount1Value: '',
    discount2Category: '',
    discount2Type: 'percentage',
    discount2Value: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const classData = classes.find(c => c.name === selectedClass);
      setMonthlyFee(classData?.monthly_fee || 0);
    }
  }, [selectedClass, classes]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      toast.error('Failed to load classes');
    } else {
      setClasses(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('concession_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      toast.error('Failed to load discount categories');
    } else {
      setCategories(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      enrollmentSchema.parse({
        studentName: formData.studentName,
        dateOfBirth: formData.dateOfBirth,
        dateOfAdmission: formData.dateOfAdmission,
        fatherName: formData.fatherName,
        parentCnic: formData.parentCnic,
        phone: formData.phone,
        className: formData.className,
      });

      // Check if parent exists
      let parentId: string | null = null;
      const rawCnic = parseCnic(formData.parentCnic);
      const { data: existingParent } = await supabase
        .from('parents')
        .select('id')
        .eq('cnic', rawCnic)
        .single();

      if (existingParent) {
        parentId = existingParent.id;
        toast.info('Parent already exists, linking student to existing parent');
      } else {
        // Generate parent ID and create parent
        const { data: generatedParentId } = await supabase
          .rpc('generate_parent_id', { father_name: formData.fatherName });

        const { data: newParent, error: parentError } = await supabase
          .from('parents')
          .insert({
            parent_id: generatedParentId,
            cnic: rawCnic,
            father_name: formData.fatherName,
            phone: formData.phone,
            phone_secondary: formData.phoneSecondary || null,
            address: formData.address || null,
          })
          .select()
          .single();

        if (parentError) throw parentError;
        parentId = newParent.id;
      }

      // Calculate total discount from applied concessions
      let totalDiscount = 0;
      
      if (formData.discount1Category) {
        const discount1Value = parseFloat(formData.discount1Value) || 0;
        if (formData.discount1Type === 'percentage') {
          totalDiscount += monthlyFee * (discount1Value / 100);
        } else {
          totalDiscount += discount1Value;
        }
      }
      
      if (formData.discount2Category) {
        const discount2Value = parseFloat(formData.discount2Value) || 0;
        if (formData.discount2Type === 'percentage') {
          totalDiscount += monthlyFee * (discount2Value / 100);
        } else {
          totalDiscount += discount2Value;
        }
      }
      
      // Calculate net fee after discounts (ensure it doesn't go below 0)
      const netMonthlyFee = Math.max(0, monthlyFee - totalDiscount);

      // Generate student ID and create student with net fee
      const { data: generatedStudentId } = await supabase
        .rpc('generate_student_id', { student_name: formData.studentName });

      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: generatedStudentId,
          parent_id: parentId,
          name: formData.studentName,
          class: formData.className,
          date_of_birth: formData.dateOfBirth,
          date_of_admission: formData.dateOfAdmission,
          cnic: formData.studentCnic ? parseCnic(formData.studentCnic) : null,
          base_fee: monthlyFee,
          monthly_fee: netMonthlyFee,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Add discount categories if selected (for record keeping)
      if (formData.discount1Category) {
        await supabase.from('student_concessions').insert({
          student_id: newStudent.id,
          category_id: formData.discount1Category,
          discount_type: formData.discount1Type,
          discount_value: parseFloat(formData.discount1Value) || 0,
          approved_by: user?.id,
        });
      }

      if (formData.discount2Category) {
        await supabase.from('student_concessions').insert({
          student_id: newStudent.id,
          category_id: formData.discount2Category,
          discount_type: formData.discount2Type,
          discount_value: parseFloat(formData.discount2Value) || 0,
          approved_by: user?.id,
        });
      }

      toast.success(`Student enrolled successfully! ID: ${generatedStudentId}`);
      navigate('/fee-collection');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error('Failed to enroll student');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background print:bg-white print:min-h-0">
      <Navigation />
      <div className="container mx-auto py-8 px-4 mt-20 print:mt-0 print:py-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold mt-4">Student Enrollment</h1>
            <p className="text-muted-foreground">Enroll new students into the school</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card
          ref={formRef}
          id="enrollment-print"
          className="max-w-4xl mx-auto print:shadow-none print:border print:max-w-none print-content"
        >
          <CardHeader className="print:pb-2">
            <CardTitle className="text-2xl">Student Enrollment Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 print:space-y-4">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Full Name *</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfAdmission">Date of Admission *</Label>
                    <Input
                      id="dateOfAdmission"
                      type="date"
                      value={formData.dateOfAdmission}
                      onChange={(e) => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentCnic">Student CNIC (Optional)</Label>
                    <Input
                      id="studentCnic"
                      value={formatCnic(formData.studentCnic)}
                      onChange={(e) => setFormData({ ...formData, studentCnic: parseCnic(e.target.value) })}
                      placeholder="xxxxx-xxxxxxx-x"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Parent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentCnic">Parent CNIC *</Label>
                    <Input
                      id="parentCnic"
                      value={formatCnic(formData.parentCnic)}
                      onChange={(e) => setFormData({ ...formData, parentCnic: parseCnic(e.target.value) })}
                      placeholder="xxxxx-xxxxxxx-x"
                      maxLength={15}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Primary Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneSecondary">Secondary Phone</Label>
                    <Input
                      id="phoneSecondary"
                      value={formData.phoneSecondary}
                      onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Academic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class *</Label>
                    <Select
                      value={formData.className}
                      onValueChange={(value) => {
                        setFormData({ ...formData, className: value });
                        setSelectedClass(value);
                      }}
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
                    <Label>Monthly Fee</Label>
                    <Input value={`Rs. ${monthlyFee}`} disabled />
                  </div>
                </div>
              </div>

              {/* Discount Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Discount Categories (Max 2)</h3>
                <div className="space-y-4">
                  {/* Discount 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category 1</Label>
                      <Select
                        value={formData.discount1Category}
                        onValueChange={(value) => setFormData({ ...formData, discount1Category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.discount1Type}
                        onValueChange={(value) => setFormData({ ...formData, discount1Type: value })}
                        disabled={!formData.discount1Category}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={formData.discount1Value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (formData.discount1Type === 'percentage' && value > 100) {
                            toast.error('Percentage discount cannot exceed 100%');
                            return;
                          }
                          if (value < 0) {
                            toast.error('Discount value cannot be negative');
                            return;
                          }
                          setFormData({ ...formData, discount1Value: e.target.value });
                        }}
                        placeholder={formData.discount1Type === 'percentage' ? '%' : 'Rs.'}
                        disabled={!formData.discount1Category}
                        min="0"
                        max={formData.discount1Type === 'percentage' ? '100' : undefined}
                      />
                    </div>
                  </div>

                  {/* Discount 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category 2</Label>
                      <Select
                        value={formData.discount2Category}
                        onValueChange={(value) => setFormData({ ...formData, discount2Category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.discount2Type}
                        onValueChange={(value) => setFormData({ ...formData, discount2Type: value })}
                        disabled={!formData.discount2Category}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={formData.discount2Value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (formData.discount2Type === 'percentage' && value > 100) {
                            toast.error('Percentage discount cannot exceed 100%');
                            return;
                          }
                          if (value < 0) {
                            toast.error('Discount value cannot be negative');
                            return;
                          }
                          setFormData({ ...formData, discount2Value: e.target.value });
                        }}
                        placeholder={formData.discount2Type === 'percentage' ? '%' : 'Rs.'}
                        disabled={!formData.discount2Category}
                        min="0"
                        max={formData.discount2Type === 'percentage' ? '100' : undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enroll Student
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Enrollment;
