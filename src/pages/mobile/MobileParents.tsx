import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Users, Phone, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatCnic } from "@/lib/utils";

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
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  monthly_fee: number;
  is_active: boolean;
}

const MobileParents = () => {
  const { user } = useAuth();
  const { isAdminOrUser } = useUserRole(user?.id);
  const { isDesktop } = useMobileDetect();
  const [searchQuery, setSearchQuery] = useState("");
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  if (isDesktop) {
    return <DesktopWarning />;
  }

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
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .or(`parent_id.ilike.%${sanitized}%,cnic.ilike.%${sanitized}%,father_name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`)
        .order('father_name')
        .limit(20);

      if (error) throw error;
      setParents(data || []);
      
      if (!data || data.length === 0) {
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
    
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parent.id)
      .order('name');

    if (error) {
      toast.error('Failed to load students');
      return;
    }

    setStudents(studentsData || []);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-destructive";
    if (balance < 0) return "text-success";
    return "text-muted-foreground";
  };

  if (!isAdminOrUser) {
    return (
      <MobileContainer>
        <MobileHeader title="Parents" />
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
        title={selectedParent ? "Parent Details" : "Parents"} 
        onBack={selectedParent ? () => setSelectedParent(null) : undefined}
      />

      {!selectedParent ? (
        <div className="p-4 space-y-4 pb-24">
          <MobileFormField label="Search Parents">
            <div className="flex gap-2">
              <Input
                placeholder="Name, CNIC, Phone, or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && searchParents()}
              />
              <Button 
                onClick={searchParents} 
                className="h-12 px-6 shadow-md touch-feedback" 
                disabled={loading}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </MobileFormField>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {parents.map((parent, idx) => (
                  <MobileCard 
                    key={parent.id} 
                    onClick={() => selectParent(parent)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{parent.father_name}</p>
                        <p className="text-sm text-muted-foreground">{parent.parent_id}</p>
                        <p className="text-xs text-muted-foreground">{parent.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${getBalanceColor(parent.current_balance)}`}>
                          Rs. {parent.current_balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  </MobileCard>
                ))}
              </div>

              {parents.length === 0 && searchQuery && (
                <div className="text-center py-12 mobile-fade-in">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No parents found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="pb-24 mobile-fade-in">
          {/* Parent Info Card with gradient */}
          <div className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mobile-fade-in">{selectedParent.father_name}</h2>
                <Badge variant="secondary" className="mt-1 shadow-sm">{selectedParent.parent_id}</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>CNIC: {formatCnic(selectedParent.cnic)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{selectedParent.phone}</span>
              </div>
              {selectedParent.phone_secondary && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{selectedParent.phone_secondary}</span>
                </div>
              )}
              {selectedParent.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{selectedParent.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary with enhanced cards */}
          <div className="p-4 space-y-3">
            <div className="bg-muted p-4 rounded-lg shadow-sm mobile-card-enter border-l-4 border-l-muted-foreground/20">
              <p className="text-sm text-muted-foreground font-medium">Total Charged</p>
              <p className="text-xl font-bold mt-1">Rs. {selectedParent.total_charged.toLocaleString()}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg shadow-sm mobile-card-enter border-l-4 border-l-success/30" style={{ animationDelay: '50ms' }}>
              <p className="text-sm text-muted-foreground font-medium">Total Paid</p>
              <p className="text-xl font-bold mt-1">Rs. {selectedParent.total_paid.toLocaleString()}</p>
            </div>

            <div 
              className={`p-4 rounded-lg shadow-md mobile-card-enter border-l-4 ${
                selectedParent.current_balance > 0 
                  ? 'bg-destructive/10 border-l-destructive' 
                  : selectedParent.current_balance < 0 
                  ? 'bg-success/10 border-l-success' 
                  : 'bg-muted border-l-muted-foreground/20'
              }`}
              style={{ animationDelay: '100ms' }}
            >
              <p className="text-sm text-muted-foreground font-medium">Current Balance</p>
              <p className={`text-2xl font-bold mt-1 ${getBalanceColor(selectedParent.current_balance)}`}>
                Rs. {selectedParent.current_balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Children List */}
          <div className="p-4 space-y-3">
            <h3 className="font-semibold">Children ({students.length})</h3>
            {students.map((student) => (
              <MobileCard key={student.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.student_id}</p>
                    <p className="text-xs text-muted-foreground">{student.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs. {student.monthly_fee}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                    {!student.is_active && (
                      <Badge variant="destructive" className="mt-1">Inactive</Badge>
                    )}
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>
      )}

      <MobileNav />
    </MobileContainer>
  );
};

export default MobileParents;
