import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Archive } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

export default function ManageCategories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryType, setCategoryType] = useState<"income" | "expense">("income");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_categories")
        .select("*")
        .order("type")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("account_categories").insert({
        ...categoryData,
        created_by: user.id,
        is_system: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      toast.success("Category added successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { error } = await supabase
        .from("account_categories")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      toast.success("Category updated successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ id, is_active }: any) => {
      const { error } = await supabase
        .from("account_categories")
        .update({ is_active: !is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      toast.success("Category status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingCategory(null);
    setCategoryType("income");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error("Please enter a category name");
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        name,
        description,
      });
    } else {
      addCategoryMutation.mutate({
        name,
        type: categoryType,
        description,
      });
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setCategoryType(category.type);
    setIsDialogOpen(true);
  };

  const incomeCategories = categories?.filter((c) => c.type === "income") || [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-20">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingCategory && (
                  <div className="space-y-2">
                    <Label>Category Type</Label>
                    <Tabs value={categoryType} onValueChange={(v: any) => setCategoryType(v)}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="income">Income</TabsTrigger>
                        <TabsTrigger value="expense">Expense</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingCategory ? "Update Category" : "Add Category"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="income" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="income">Income Categories</TabsTrigger>
            <TabsTrigger value="expense">Expense Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomeCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex gap-2">
                        {category.is_system && (
                          <Badge variant="secondary">System</Badge>
                        )}
                        {!category.is_active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description || "No description"}
                    </p>
                    <div className="flex gap-2">
                      {!category.is_system && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleCategoryMutation.mutate({
                            id: category.id,
                            is_active: category.is_active,
                          })
                        }
                      >
                        <Archive className="h-4 w-4" />
                        {category.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expenseCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex gap-2">
                        {category.is_system && (
                          <Badge variant="secondary">System</Badge>
                        )}
                        {!category.is_active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description || "No description"}
                    </p>
                    <div className="flex gap-2">
                      {!category.is_system && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleCategoryMutation.mutate({
                            id: category.id,
                            is_active: category.is_active,
                          })
                        }
                      >
                        <Archive className="h-4 w-4" />
                        {category.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
