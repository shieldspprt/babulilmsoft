import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileContainer } from "@/components/mobile/MobileContainer";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileNav } from "@/components/mobile/MobileNav";
import { MobileCard } from "@/components/mobile/MobileCard";
import { MobileFormField } from "@/components/mobile/MobileFormField";
import { DesktopWarning } from "@/components/mobile/DesktopWarning";
import { useMobileDetect } from "@/hooks/useMobileDetect";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserCircle, Phone, GraduationCap, Calendar } from "lucide-react";
import { formatCnic, formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  cnic: string;
  personal_phone: string;
  education: string;
  assigned_class: string | null;
  date_of_joining: string;
  is_active: boolean;
  employee_type: 'teacher' | 'staff';
}

const MobileManageTeachers = () => {
  const { user } = useAuth();
  const { isAdminOrUser } = useUserRole(user?.id);
  const { isDesktop } = useMobileDetect();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

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
    enabled: !isDesktop && isAdminOrUser,
  });

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name} ${teacher.cnic} ${teacher.teacher_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (isDesktop) {
    return <DesktopWarning />;
  }

  if (!isAdminOrUser) {
    return (
      <MobileContainer>
        <MobileHeader title="Teachers" />
        <div className="p-4 text-center">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
        <MobileNav />
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <MobileHeader 
        title={selectedTeacher ? "Teacher Details" : "Teachers & Staff"} 
        onBack={selectedTeacher ? () => setSelectedTeacher(null) : undefined}
      />

      {!selectedTeacher ? (
        <div className="p-4 space-y-4 pb-24">
          <MobileFormField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name, CNIC, or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 text-base pl-10"
              />
            </div>
          </MobileFormField>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {filteredTeachers.map((teacher, idx) => (
                  <MobileCard 
                    key={teacher.id} 
                    onClick={() => setSelectedTeacher(teacher)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{teacher.first_name} {teacher.last_name}</p>
                          {!teacher.is_active && (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{teacher.teacher_id}</p>
                        <p className="text-xs text-muted-foreground capitalize">{teacher.employee_type}</p>
                      </div>
                      <div className="text-right">
                        {teacher.assigned_class && (
                          <Badge variant="outline" className="text-xs shadow-sm">{teacher.assigned_class}</Badge>
                        )}
                      </div>
                    </div>
                  </MobileCard>
                ))}
              </div>

              {filteredTeachers.length === 0 && (
                <div className="text-center py-12 mobile-fade-in">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                    <UserCircle className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No teachers found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="pb-24 mobile-fade-in">
          {/* Teacher Info Card with gradient */}
          <div className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mobile-fade-in">{selectedTeacher.first_name} {selectedTeacher.last_name}</h2>
                <Badge variant="secondary" className="mt-1 shadow-sm">{selectedTeacher.teacher_id}</Badge>
              </div>
              {!selectedTeacher.is_active && (
                <Badge variant="destructive" className="shadow-sm">Inactive</Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Type:</span>
                <span className="capitalize">{selectedTeacher.employee_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{selectedTeacher.personal_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">CNIC:</span>
                <span>{formatCnic(selectedTeacher.cnic)}</span>
              </div>
            </div>
          </div>

          {/* Details Cards with enhanced styling */}
          <div className="p-4 space-y-3">
            <div className="bg-muted p-4 rounded-lg shadow-sm mobile-card-enter border-l-4 border-l-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <p className="font-semibold">Education</p>
              </div>
              <p className="text-sm">{selectedTeacher.education}</p>
            </div>

            {selectedTeacher.assigned_class && (
              <div className="bg-muted p-4 rounded-lg shadow-sm mobile-card-enter border-l-4 border-l-primary/30" style={{ animationDelay: '50ms' }}>
                <p className="text-sm text-muted-foreground font-medium mb-1">Assigned Class</p>
                <p className="text-lg font-bold">{selectedTeacher.assigned_class}</p>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg shadow-sm mobile-card-enter border-l-4 border-l-primary/30" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="font-semibold">Date of Joining</p>
              </div>
              <p className="text-sm">{formatDate(selectedTeacher.date_of_joining)}</p>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </MobileContainer>
  );
};

export default MobileManageTeachers;
