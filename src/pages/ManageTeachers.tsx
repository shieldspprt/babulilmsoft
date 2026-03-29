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
import { ArrowLeft, Plus, Edit, UserX, UserCheck, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { formatCnic, parseCnic, formatDate } from "@/lib/utils";


interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  father_name: string;
  cnic: string;
  date_of_birth: string;
  education: string;
  institute: string;
  home_address: string;
  personal_phone: string;
  home_phone: string | null;
  assigned_class: string | null;
  date_of_joining: string;
  is_active: boolean;
  employee_type: 'teacher' | 'staff';
}

const ManageTeachers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    cnic: "",
    date_of_birth: "",
    education: "",
    institute: "",
    home_address: "",
    personal_phone: "",
    home_phone: "",
    assigned_class: "",
    date_of_joining: new Date().toISOString().split('T')[0],
    employee_type: "teacher" as 'teacher' | 'staff',
  });

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Teacher[];
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const addTeacherMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const teacherId = await supabase.rpc("generate_teacher_id", {
        first_name: data.first_name,
        last_name: data.last_name,
      });

      const { error } = await supabase.from("teachers").insert({
        ...data,
        teacher_id: teacherId.data,
        created_by: user?.id,
        assigned_class: data.assigned_class || null,
        home_phone: data.home_phone || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "Teacher added successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding teacher",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("teachers")
        .update({
          ...data,
          assigned_class: data.assigned_class || null,
          home_phone: data.home_phone || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "Teacher updated successfully" });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating teacher",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("teachers")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "Teacher status updated" });
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
      first_name: "",
      last_name: "",
      father_name: "",
      cnic: "",
      date_of_birth: "",
      education: "",
      institute: "",
      home_address: "",
      personal_phone: "",
      home_phone: "",
      assigned_class: "",
      date_of_joining: new Date().toISOString().split('T')[0],
      employee_type: "teacher",
    });
    setEditingTeacher(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawCnic = parseCnic(formData.cnic);
    if (rawCnic.length !== 13) {
      toast({
        title: "Invalid CNIC",
        description: "CNIC must be exactly 13 digits",
        variant: "destructive",
      });
      return;
    }

    if (editingTeacher) {
      updateTeacherMutation.mutate({ id: editingTeacher.id, data: formData });
    } else {
      addTeacherMutation.mutate(formData);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      father_name: teacher.father_name,
      cnic: teacher.cnic,
      date_of_birth: teacher.date_of_birth,
      education: teacher.education,
      institute: teacher.institute,
      home_address: teacher.home_address,
      personal_phone: teacher.personal_phone,
      home_phone: teacher.home_phone || "",
      assigned_class: teacher.assigned_class || "",
      date_of_joining: teacher.date_of_joining,
      employee_type: teacher.employee_type,
    });
    setIsDialogOpen(true);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = `${teacher.first_name} ${teacher.last_name} ${teacher.cnic} ${teacher.teacher_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || teacher.employee_type === filterType;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && teacher.is_active) || 
      (filterStatus === "inactive" && !teacher.is_active);
    const matchesClass = filterClass === "all" || 
      (filterClass === "unassigned" && !teacher.assigned_class) ||
      teacher.assigned_class === filterClass;
    return matchesSearch && matchesType && matchesStatus && matchesClass;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Staff</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage school teachers and staff members" : "View all teachers and staff"}
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, CNIC, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.name} value={cls.name}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center">
          
            <p className="text-sm text-muted-foreground">
              Showing {filteredTeachers.length} of {teachers.length} employees
            </p>
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
                    Add Teacher/Staff
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTeacher ? "Edit Employee" : "Add New Employee"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Employee Type</h3>
                  <div>
                    <Label htmlFor="employee_type">Employee Type *</Label>
                    <Select
                      value={formData.employee_type}
                      onValueChange={(value) => setFormData({ ...formData, employee_type: value as 'teacher' | 'staff' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="father_name">Father Name *</Label>
                    <Input
                      id="father_name"
                      required
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cnic">CNIC *</Label>
                      <Input
                        id="cnic"
                        required
                        maxLength={15}
                        value={formatCnic(formData.cnic)}
                        onChange={(e) => setFormData({ ...formData, cnic: parseCnic(e.target.value) })}
                        placeholder="xxxxx-xxxxxxx-x"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth *</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        required
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Education Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="education">Qualification *</Label>
                      <Input
                        id="education"
                        required
                        placeholder="e.g., M.A, B.Ed"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="institute">Institute *</Label>
                      <Input
                        id="institute"
                        required
                        placeholder="University/College name"
                        value={formData.institute}
                        onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div>
                    <Label htmlFor="home_address">Home Address *</Label>
                    <Input
                      id="home_address"
                      required
                      value={formData.home_address}
                      onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="personal_phone">Personal Phone *</Label>
                      <Input
                        id="personal_phone"
                        required
                        type="tel"
                        value={formData.personal_phone}
                        onChange={(e) => setFormData({ ...formData, personal_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="home_phone">Home Phone</Label>
                      <Input
                        id="home_phone"
                        type="tel"
                        value={formData.home_phone}
                        onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Assignment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assigned_class">Assigned Class</Label>
                      <Select
                        value={formData.assigned_class}
                        onValueChange={(value) => setFormData({ ...formData, assigned_class: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.name} value={cls.name}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date_of_joining">Date of Joining *</Label>
                      <Input
                        id="date_of_joining"
                        type="date"
                        required
                        value={formData.date_of_joining}
                        onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTeacher ? "Update Employee" : "Add Employee"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>CNIC</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Class</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center">No employees found</TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-mono">{teacher.teacher_id}</TableCell>
                    <TableCell>
                      {teacher.first_name} {teacher.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.employee_type === 'teacher' ? 'default' : 'secondary'}>
                        {teacher.employee_type.charAt(0).toUpperCase() + teacher.employee_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCnic(teacher.cnic)}</TableCell>
                    <TableCell>{teacher.personal_phone}</TableCell>
                    <TableCell>{teacher.assigned_class || "-"}</TableCell>
                    <TableCell>
                      {teacher.is_active ? (
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
                            onClick={() => handleEdit(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleActiveStatusMutation.mutate({
                                id: teacher.id,
                                isActive: teacher.is_active,
                              })
                            }
                          >
                            {teacher.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
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

export default ManageTeachers;
