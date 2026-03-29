import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowUpCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
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

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  monthly_fee: number;
}

interface Class {
  id: string;
  name: string;
  monthly_fee: number;
  class_type: 'regular' | 'passout';
}

const ClassPromotion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentClass, setCurrentClass] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [targetClass, setTargetClass] = useState('');
  const [customFee, setCustomFee] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (currentClass) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents(new Set());
    }
  }, [currentClass]);

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast.error('Failed to load classes');
      return;
    }

    setClasses(data || []);
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', currentClass)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setStudents(data || []);
      setSelectedStudents(new Set());
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const selectAll = () => {
    setSelectedStudents(new Set(students.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedStudents(new Set());
  };

  const getTargetClassFee = () => {
    const targetClassData = classes.find(c => c.name === targetClass);
    return targetClassData?.monthly_fee || 0;
  };

  const getFinalFee = () => {
    if (customFee) {
      return parseFloat(customFee) || 0;
    }
    return getTargetClassFee();
  };

  const handlePromote = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!targetClass) {
      toast.error('Please select a target class');
      return;
    }

    if (currentClass === targetClass) {
      toast.error('Target class must be different from current class');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmPromotion = async () => {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const finalFee = getFinalFee();
      
      const updates = Array.from(selectedStudents).map(studentId =>
        supabase
          .from('students')
          .update({
            class: targetClass,
            monthly_fee: finalFee,
          })
          .eq('id', studentId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        throw new Error('Failed to update some students');
      }

      toast.success(`${selectedStudents.size} student(s) moved to ${targetClass}`);

      // Reset form
      setSelectedStudents(new Set());
      setTargetClass('');
      setCustomFee('');
      setNotes('');
      loadStudents();
    } catch (error: any) {
      toast.error('Failed to promote students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedStudents.size;
  const selectedStudentsList = students.filter(s => selectedStudents.has(s.id));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 pt-24 space-y-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Class Promotion & Management</h1>
          <p className="text-muted-foreground">
            Promote students between classes or convert entire classes to pass-out type for exam periods.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Class</Label>
                <Select value={currentClass} onValueChange={setCurrentClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose current class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {students.length > 0 && (
                <>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAll}
                      className="flex-1"
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={deselectAll}
                      className="flex-1"
                    >
                      Deselect All
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <Label>Students ({selectedCount} selected)</Label>
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => toggleStudent(student.id)}
                      >
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.student_id} • Rs. {student.monthly_fee}/month
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {currentClass && students.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active students in this class
                </p>
              )}

              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promotion Details */}
          <Card>
            <CardHeader>
              <CardTitle>Promotion Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Move to Class</Label>
                <Select value={targetClass} onValueChange={setTargetClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose target class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes
                      .filter(cls => cls.name !== currentClass)
                      .map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name} • Rs. {cls.monthly_fee}/month
                          {cls.class_type === 'passout' && ' • Pass-out'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {targetClass && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">New Monthly Fee</p>
                  <p className="text-2xl font-bold">Rs. {getTargetClassFee()}</p>
                  <p className="text-xs text-muted-foreground">
                    (from {targetClass} class fee)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Override Fee (Optional)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty to use class fee"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                />
                {customFee && (
                  <p className="text-xs text-muted-foreground">
                    Custom fee: Rs. {parseFloat(customFee) || 0}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Reason for promotion or any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedCount > 0 && targetClass && (
                <div className="space-y-2 p-4 bg-primary/10 rounded-lg">
                  <p className="font-medium">Summary</p>
                  <div className="space-y-1 text-sm">
                    <p>• Moving {selectedCount} student(s)</p>
                    <p>• From: {currentClass}</p>
                    <p>• To: {targetClass}</p>
                    <p>• New Fee: Rs. {getFinalFee()}/month</p>
                  </div>
                  {selectedStudentsList.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Selected Students:</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {selectedStudentsList.map((student) => (
                          <p key={student.id} className="text-xs">
                            • {student.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handlePromote}
                disabled={loading || selectedCount === 0 || !targetClass}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Promote ${selectedCount || ''} Student${selectedCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Class Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to move {selectedCount} student(s) from <strong>{currentClass}</strong> to <strong>{targetClass}</strong>.
              <br /><br />
              Their monthly fee will be updated to <strong>Rs. {getFinalFee()}</strong>.
              <br /><br />
              This action cannot be undone easily. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromotion}>
              Yes, Promote Students
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassPromotion;
