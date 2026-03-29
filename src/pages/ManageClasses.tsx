import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

interface Class {
  id: string;
  name: string;
  monthly_fee: number;
  admission_fee: number | null;
  annual_charges: number | null;
  academic_year?: string;
  is_active: boolean;
  teacher_id: string | null;
  class_type: 'regular' | 'passout';
}

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
}

interface StudentCount {
  class: string;
  count: number;
}

const ManageClasses = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  const [formData, setFormData] = useState({
    name: "",
    monthly_fee: "",
    admission_fee: "",
    annual_charges: "",
    teacher_id: "",
    class_type: "regular" as 'regular' | 'passout',
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Class[];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, teacher_id, first_name, last_name")
        .eq("is_active", true)
        .order("first_name");
      
      if (error) throw error;
      return data as Teacher[];
    },
  });

  const { data: studentCounts = [] } = useQuery({
    queryKey: ["student-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("class")
        .eq("is_active", true);
      
      if (error) throw error;
      
      const counts = data.reduce((acc: Record<string, number>, student) => {
        acc[student.class] = (acc[student.class] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(counts).map(([className, count]) => ({
        class: className,
        count: count as number,
      })) as StudentCount[];
    },
  });

  const addClassMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("classes").insert({
        name: data.name,
        monthly_fee: parseFloat(data.monthly_fee),
        admission_fee: parseFloat(data.admission_fee || "0"),
        annual_charges: parseFloat(data.annual_charges || "0"),
        teacher_id: data.teacher_id || null,
        class_type: data.class_type,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class added successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding class",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("classes")
        .update({
          name: data.name,
          monthly_fee: parseFloat(data.monthly_fee),
          admission_fee: parseFloat(data.admission_fee || "0"),
          annual_charges: parseFloat(data.annual_charges || "0"),
          teacher_id: data.teacher_id || null,
          class_type: data.class_type,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class updated successfully" });
      setIsDialogOpen(false);
      setEditingClass(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating class",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("classes")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class status updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      monthly_fee: "",
      admission_fee: "",
      annual_charges: "",
      teacher_id: "",
      class_type: "regular",
    });
    setEditingClass(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      addClassMutation.mutate(formData);
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      monthly_fee: cls.monthly_fee.toString(),
      admission_fee: cls.admission_fee?.toString() || "",
      annual_charges: cls.annual_charges?.toString() || "",
      teacher_id: cls.teacher_id || "",
      class_type: cls.class_type || "regular",
    });
    setIsDialogOpen(true);
  };

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "-";
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : "-";
  };

  const getStudentCount = (className: string) => {
    const count = studentCounts.find((sc) => sc.class === className);
    return count ? count.count : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Classes Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage classes and their details" : "View all classes"}
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div></div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingClass ? "Edit Class" : "Add New Class"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Class Name *</Label>
                    <Input
                      id="name"
                      required
                      placeholder="e.g., Grade 1, Pre-Nursery"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthly_fee">Monthly Fee (Rs) *</Label>
                    <Input
                      id="monthly_fee"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="admission_fee">Admission Fee (Rs)</Label>
                    <Input
                      id="admission_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.admission_fee}
                      onChange={(e) => setFormData({ ...formData, admission_fee: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="annual_charges">Annual Charges (Rs)</Label>
                    <Input
                      id="annual_charges"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.annual_charges}
                      onChange={(e) => setFormData({ ...formData, annual_charges: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="class_type">Class Type</Label>
                    <Select
                      value={formData.class_type}
                      onValueChange={(value) => setFormData({ ...formData, class_type: value as 'regular' | 'passout' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="passout">Pass-out</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pass-out classes are for exam/transition periods
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="teacher_id">Assign Teacher</Label>
                    <Select
                      value={formData.teacher_id}
                      onValueChange={(value) => setFormData({ ...formData, teacher_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name} ({teacher.teacher_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingClass ? "Update Class" : "Add Class"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Assigned Teacher</TableHead>
                <TableHead>Students Enrolled</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      {cls.class_type === 'passout' ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          Pass-out
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          Regular
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>Rs {(cls.monthly_fee ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{getTeacherName(cls.teacher_id)}</TableCell>
                    <TableCell>{getStudentCount(cls.name)}</TableCell>
                    <TableCell>
                      {cls.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleActiveStatusMutation.mutate({
                                id: cls.id,
                                isActive: cls.is_active,
                              })
                            }
                          >
                            {cls.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ManageClasses;
