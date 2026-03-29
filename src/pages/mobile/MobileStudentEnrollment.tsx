import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileContainer } from '@/components/mobile/MobileContainer';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileNav } from '@/components/mobile/MobileNav';
import { MobileFormField } from '@/components/mobile/MobileFormField';
import { MobileStepIndicator } from '@/components/mobile/MobileStepIndicator';
import { DesktopWarning } from '@/components/mobile/DesktopWarning';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatCnic, parseCnic } from '@/lib/utils';

const enrollmentSchema = z.object({
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
  parentCnic: z.string().refine((val) => parseCnic(val).length === 13, 'CNIC must be exactly 13 digits'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  className: z.string().min(1, 'Please select a class'),
});

const MobileStudentEnrollment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDesktop } = useMobileDetect();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
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
      pdf.save(`student-enrollment-form.pdf`);
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
    fatherName: '',
    parentCnic: '',
    phone: '',
    phoneSecondary: '',
    address: '',
    className: '',
  });

  const steps = [
    { label: 'Student', description: 'Basic info' },
    { label: 'Parent', description: 'Contact info' },
    { label: 'Class', description: 'Academic details' },
  ];

  useEffect(() => {
    fetchClasses();
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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      enrollmentSchema.parse({
        studentName: formData.studentName,
        dateOfBirth: formData.dateOfBirth,
        fatherName: formData.fatherName,
        parentCnic: formData.parentCnic,
        phone: formData.phone,
        className: formData.className,
      });

      let parentId: string | null = null;
      const rawCnic = parseCnic(formData.parentCnic);
      const { data: existingParent } = await supabase
        .from('parents')
        .select('id')
        .eq('cnic', rawCnic)
        .maybeSingle();

      if (existingParent) {
        parentId = existingParent.id;
        toast.info('Parent already exists, linking student');
      } else {
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

      const { data: generatedStudentId } = await supabase
        .rpc('generate_student_id', { student_name: formData.studentName });

      const { error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: generatedStudentId,
          parent_id: parentId,
          name: formData.studentName,
          class: formData.className,
          date_of_birth: formData.dateOfBirth,
          date_of_admission: formData.dateOfAdmission,
          monthly_fee: monthlyFee,
        });

      if (studentError) throw studentError;

      toast.success(`Student enrolled! ID: ${generatedStudentId}`);
      navigate('/mobile/dashboard');
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

  if (isDesktop) {
    return <DesktopWarning />;
  }

  return (
    <MobileContainer>
      <MobileHeader 
        title="Enroll Student" 
        className="bg-primary text-primary-foreground border-primary"
        action={
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrint} className="text-primary-foreground hover:bg-primary-foreground/20">
              <Printer className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportPDF} className="text-primary-foreground hover:bg-primary-foreground/20">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        }
      />
      
      <MobileStepIndicator steps={steps} currentStep={currentStep} />

      <div ref={formRef} className="p-4 space-y-4 pb-24 print:pb-4">
        {/* Step 0: Student Information */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <MobileFormField label="Full Name" required>
              <Input
                placeholder="Student's full name"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Date of Birth" required>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Date of Admission" required>
              <Input
                type="date"
                value={formData.dateOfAdmission}
                onChange={(e) => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                className="h-12 text-base"
              />
            </MobileFormField>

            <Button 
              className="w-full h-12 shadow-md touch-feedback" 
              onClick={() => setCurrentStep(1)}
              disabled={!formData.studentName || !formData.dateOfBirth}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 1: Parent Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <MobileFormField label="Father's Name" required>
              <Input
                placeholder="Father's full name"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Parent CNIC" required>
              <Input
                placeholder="xxxxx-xxxxxxx-x"
                value={formatCnic(formData.parentCnic)}
                onChange={(e) => setFormData({ ...formData, parentCnic: parseCnic(e.target.value) })}
                maxLength={15}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Primary Phone" required>
              <Input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Secondary Phone">
              <Input
                type="tel"
                placeholder="Optional"
                value={formData.phoneSecondary}
                onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
                className="h-12 text-base"
              />
            </MobileFormField>

            <MobileFormField label="Address">
              <Textarea
                placeholder="Home address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="text-base"
              />
            </MobileFormField>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12 touch-feedback" 
                onClick={() => setCurrentStep(0)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 h-12 shadow-md touch-feedback" 
                onClick={() => setCurrentStep(2)}
                disabled={!formData.fatherName || !formData.parentCnic || !formData.phone}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Class & Fee */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <MobileFormField label="Class" required>
              <Select
                value={formData.className}
                onValueChange={(value) => {
                  setFormData({ ...formData, className: value });
                  setSelectedClass(value);
                }}
              >
                <SelectTrigger className="h-12 text-base">
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
            </MobileFormField>

            {monthlyFee > 0 && (
              <div className="bg-gradient-to-br from-primary/15 to-primary/5 p-4 rounded-lg shadow-sm mobile-card-enter border-l-4 border-l-primary">
                <p className="text-sm text-muted-foreground font-medium">Monthly Fee</p>
                <p className="text-2xl font-bold mt-1">Rs. {monthlyFee}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12 touch-feedback" 
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button 
                className="flex-1 h-12 shadow-md touch-feedback" 
                onClick={handleSubmit}
                disabled={loading || !formData.className}
              >
                {loading ? 'Enrolling...' : 'Enroll Student'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </MobileContainer>
  );
};

export default MobileStudentEnrollment;
