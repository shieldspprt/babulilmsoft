import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Search, ArrowLeft, GraduationCap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Checkbox } from '@/components/ui/checkbox';
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
  parent_id: string;
}

const StudentPassOut = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [classes, setClasses] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [passoutReason, setPassoutReason] = useState('graduated');
  const [passoutDate, setPassoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (data) {
      setClasses(data.map(c => c.name));
    }
  };

  const searchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('is_active', true);

      // Apply class filter
      if (filterClass !== 'all') {
        query = query.eq('class', filterClass);
      }

      // Apply search filter if provided
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,student_id.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      setSearchResults(data || []);
      if (!data?.length) {
        toast.info('No active students found');
      }
    } catch (error: any) {
      toast.error('Failed to search students');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectAll = () => {
    setSelectedStudents(new Set(searchResults.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedStudents(new Set());
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

  const handlePassOut = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!passoutDate) {
      toast.error('Please select a pass-out date');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmPassOut = async () => {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const updates = Array.from(selectedStudents).map(studentId =>
        supabase
          .from('students')
          .update({
            is_active: false,
            passout_date: passoutDate,
            passout_reason: passoutReason,
          })
          .eq('id', studentId)
      );

      const results = await Promise.all(updates);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to update some students');
      }

      toast.success(`${selectedStudents.size} student(s) marked as passed out`);

      // Reset form
      setSelectedStudents(new Set());
      setSearchResults([]);
      setSearchQuery('');
      setNotes('');

    } catch (error: any) {
      toast.error('Failed to mark students as passed out');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedStudents.size;
  const selectedStudentsList = searchResults.filter(s => selectedStudents.has(s.id));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 pt-24 space-y-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Final Student Pass-Out</h1>
          <p className="text-muted-foreground">
            This marks students as permanently passed out (graduated/left school). 
            For exam periods, use Class Promotion to move classes to pass-out type instead.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>Search Active Students</CardTitle>
              <p className="text-sm text-muted-foreground">
                Find students who are leaving the school permanently
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search by Name or ID (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter search term..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                  />
                  <Button onClick={searchStudents} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
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
                    <Label>Select Students ({selectedCount} selected)</Label>
                    {searchResults.map((student) => (
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
                            {student.student_id} • {student.class}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pass-Out Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Final Pass-Out Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Record why students are leaving the school
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={passoutReason} onValueChange={setPassoutReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graduated">Graduated (Completed Final Grade)</SelectItem>
                    <SelectItem value="transferred">Transferred to Another School</SelectItem>
                    <SelectItem value="dropped_out">Dropped Out</SelectItem>
                    <SelectItem value="withdrew">Withdrew (Family Reasons)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pass-Out Date</Label>
                <Input
                  type="date"
                  value={passoutDate}
                  onChange={(e) => setPassoutDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {selectedCount > 0 && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <p className="font-medium">Selected Students ({selectedCount}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedStudentsList.map((student) => (
                      <p key={student.id} className="text-sm">
                        • {student.name} ({student.class})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handlePassOut}
                disabled={loading || selectedCount === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Mark ${selectedCount || ''} Student${selectedCount !== 1 ? 's' : ''} as Passed Out`
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
            <AlertDialogTitle>Confirm Student Pass-Out</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark {selectedCount} student(s) as passed out.
              <br /><br />
              Reason: <strong>{passoutReason}</strong>
              <br />
              Date: <strong>{new Intl.DateTimeFormat('en-GB').format(new Date(passoutDate))}</strong>
              <br /><br />
              These students will be deactivated and will no longer appear in active student lists.
              <br /><br />
              Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPassOut}>
              Yes, Mark as Passed Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentPassOut;
