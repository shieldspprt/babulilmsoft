import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { School as SchoolIcon, Save, ArrowLeft, Image as ImageIcon, MapPin, Phone, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function SchoolSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
  });

  useEffect(() => {
    if (!roleLoading && !isAdmin && user) {
      toast.error("You don't have permission to access school settings");
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate, user]);

  useEffect(() => {
    if (user && isAdmin) {
      loadSchoolData();
    }
  }, [user, isAdmin]);

  const loadSchoolData = async () => {
    try {
      setLoading(true);
      // Fetch the school associated with this user
      // We assume the user has 1 school or we get the first one they own
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, phone, email, address, logo_url")
        .eq("owner_id", user?.id)
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSchoolId(data.id);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading school data:", error);
      toast.error("Failed to load school settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("School name is required");
      return;
    }

    if (!schoolId) {
      toast.error("No school found to update");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("schools")
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          logo_url: formData.logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schoolId);

      if (error) throw error;

      toast.success("School settings updated successfully");
    } catch (error: any) {
      console.error("Error updating school settings:", error);
      toast.error(error.message || "Failed to update school settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] mt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 mt-20">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SchoolIcon className="h-8 w-8 text-primary" />
              School Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your school's profile, contact info, and branding
            </p>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              These details will be used on receipts and external communications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <SchoolIcon className="w-4 h-4 text-muted-foreground" />
                  School Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Modern International School"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Contact Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 0300 1234567"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Contact Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. info@school.edu.pk"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logo_url" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    Logo Image URL
                  </Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleInputChange}
                    placeholder="e.g. https://drive.google.com/.../view"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a public URL to your school's logo image.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Full Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 123 Main Street, City"
                />
              </div>
              
              {formData.logo_url && (
                <div className="mt-4 p-4 border rounded-md bg-muted/30">
                  <Label className="mb-2 block">Logo Preview</Label>
                  <div className="h-24 max-w-xs flex items-center justify-center overflow-hidden rounded border bg-white p-2">
                    <img 
                      src={formData.logo_url} 
                      alt="School Logo Preview" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Settings
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
