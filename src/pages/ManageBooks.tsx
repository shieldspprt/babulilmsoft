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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Eye, EyeOff, Layers, Tags, AlertTriangle, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";


interface SyllabusType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface BookItem {
  id: string;
  name: string;
  syllabus_type_id: string;
  class_name: string;
  unit_cost: number;
  selling_price: number;
  current_stock: number;
  is_active: boolean;
  syllabus_types?: { name: string };
}

interface BookSet {
  id: string;
  name: string;
  syllabus_type_id: string;
  class_name: string;
  set_price: number;
  unit_cost: number;
  current_stock: number;
  is_active: boolean;
  syllabus_types?: { name: string };
  book_set_items?: Array<{
    id: string;
    book_item_id: string;
    quantity: number;
    book_items?: { name: string; current_stock: number };
  }>;
}

interface ClassData {
  id: string;
  name: string;
  syllabus_type_id: string | null;
}

const ManageBooks = () => {
  const [activeTab, setActiveTab] = useState("sets");
  const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
  const [setDialogOpen, setSetDialogOpen] = useState(false);
  const [setStockAdjustDialogOpen, setSetStockAdjustDialogOpen] = useState(false);
  
  const [editingSyllabus, setEditingSyllabus] = useState<SyllabusType | null>(null);
  const [editingSet, setEditingSet] = useState<BookSet | null>(null);
  const [adjustingSet, setAdjustingSet] = useState<BookSet | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  // Form states
  const [syllabusForm, setSyllabusForm] = useState({ name: "", description: "" });
  const [setForm, setSetForm] = useState({ 
    name: "", syllabus_type_id: "", class_name: "", set_price: "", number_of_books: ""
  });
  const [setAdjustmentForm, setSetAdjustmentForm] = useState({ quantity: "", notes: "" });

  // Queries
  const { data: syllabusTypes = [] } = useQuery({
    queryKey: ["syllabus-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("syllabus_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as SyllabusType[];
    },
  });

  const { data: bookItems = [] } = useQuery({
    queryKey: ["book-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_items")
        .select("*, syllabus_types(name)")
        .order("class_name")
        .order("name");
      if (error) throw error;
      return data as BookItem[];
    },
  });

  const { data: bookSets = [], isLoading: setsLoading } = useQuery({
    queryKey: ["book-sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_sets")
        .select("*, syllabus_types(name), book_set_items(id, book_item_id, quantity, book_items(name, current_stock))")
        .order("class_name")
        .order("name");
      if (error) throw error;
      return data as BookSet[];
    },
  });

  // Set stock adjustment mutation
  const adjustSetStockMutation = useMutation({
    mutationFn: async ({ setId, quantity, notes }: { setId: string; quantity: number; notes: string }) => {
      const { error } = await supabase
        .from("book_stock_transactions")
        .insert({
          book_set_id: setId,
          transaction_type: "adjustment",
          quantity: quantity,
          notes: notes || null,
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-sets"] });
      toast({ title: "Set stock adjusted successfully" });
      setSetStockAdjustDialogOpen(false);
      setAdjustingSet(null);
      setSetAdjustmentForm({ quantity: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-for-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, syllabus_type_id")
        .eq("is_active", true)
        .eq("class_type", "regular")
        .order("name");
      if (error) throw error;
      return data as ClassData[];
    },
  });

  // Syllabus mutations
  const saveSyllabusMutation = useMutation({
    mutationFn: async (data: typeof syllabusForm) => {
      if (editingSyllabus) {
        const { error } = await supabase
          .from("syllabus_types")
          .update({ name: data.name, description: data.description || null })
          .eq("id", editingSyllabus.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("syllabus_types")
          .insert({ name: data.name, description: data.description || null, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-types"] });
      toast({ title: editingSyllabus ? "Syllabus type updated" : "Syllabus type added" });
      setSyllabusDialogOpen(false);
      resetSyllabusForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleSyllabusStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("syllabus_types")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-types"] });
      toast({ title: "Status updated" });
    },
  });

  // Book set mutations
  const saveSetMutation = useMutation({
    mutationFn: async (data: typeof setForm) => {
      // Use null for syllabus_type_id when "mixed" is selected
      const syllabusTypeId = data.syllabus_type_id === "mixed" ? null : data.syllabus_type_id;
      
      if (editingSet) {
        // Update set
        const { error: setError } = await supabase
          .from("book_sets")
          .update({
            name: data.name,
            syllabus_type_id: syllabusTypeId,
            class_name: data.class_name,
            set_price: parseFloat(data.set_price),
            number_of_books: parseInt(data.number_of_books) || 0,
          })
          .eq("id", editingSet.id);
        if (setError) throw setError;
      } else {
        // Create new set
        const { error: setError } = await supabase
          .from("book_sets")
          .insert({
            name: data.name,
            syllabus_type_id: syllabusTypeId,
            class_name: data.class_name,
            set_price: parseFloat(data.set_price),
            number_of_books: parseInt(data.number_of_books) || 0,
            created_by: user?.id,
          });
        if (setError) throw setError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-sets"] });
      toast({ title: editingSet ? "Book set updated" : "Book set created" });
      setSetDialogOpen(false);
      resetSetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleSetStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("book_sets")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-sets"] });
      toast({ title: "Status updated" });
    },
  });

  // Reset forms
  const resetSyllabusForm = () => {
    setSyllabusForm({ name: "", description: "" });
    setEditingSyllabus(null);
  };

  const resetSetForm = () => {
    setSetForm({ name: "", syllabus_type_id: "", class_name: "", set_price: "", number_of_books: "" });
    setEditingSet(null);
  };

  // Edit handlers
  const handleEditSyllabus = (syllabus: SyllabusType) => {
    setEditingSyllabus(syllabus);
    setSyllabusForm({ name: syllabus.name, description: syllabus.description || "" });
    setSyllabusDialogOpen(true);
  };

  const handleEditSet = (set: BookSet) => {
    setEditingSet(set);
    setSetForm({
      name: set.name,
      syllabus_type_id: set.syllabus_type_id || "mixed",
      class_name: set.class_name,
      set_price: set.set_price.toString(),
      number_of_books: (set as any).number_of_books?.toString() || "0",
    });
    setSetDialogOpen(true);
  };

  const handleAdjustSetStock = (set: BookSet) => {
    setAdjustingSet(set);
    setSetAdjustmentForm({ quantity: "", notes: "" });
    setSetStockAdjustDialogOpen(true);
  };


  // Stock calculations
  const activeSets = bookSets.filter(s => s.is_active);
  const lowStockSets = activeSets.filter(s => s.current_stock > 0 && s.current_stock < 5);
  const outOfStockSets = activeSets.filter(s => s.current_stock === 0);
  const totalSetStock = activeSets.reduce((sum, s) => sum + (s.current_stock || 0), 0);
  const totalStockValue = activeSets.reduce((sum, s) => sum + ((s.current_stock || 0) * s.set_price), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Book & Syllabus Management</h1>
          <p className="text-muted-foreground">Manage book sets, inventory, and syllabus types</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sets" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Book Sets
            </TabsTrigger>
            <TabsTrigger value="syllabus" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Syllabus Types
            </TabsTrigger>
          </TabsList>

          {/* Book Sets Tab - Merged with Stock Overview */}
          <TabsContent value="sets">
            {/* Stock Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Book Sets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{activeSets.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sets in Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalSetStock}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Total Stock Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">Rs {totalStockValue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className={outOfStockSets.length > 0 ? "border-destructive" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {outOfStockSets.length > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    Out of Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{outOfStockSets.length}</p>
                </CardContent>
              </Card>
              <Card className={lowStockSets.length > 0 ? "border-yellow-500" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock (&lt;5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockSets.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Add Book Set Button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Book Sets Inventory</h3>
              {isAdmin && (
                <Dialog open={setDialogOpen} onOpenChange={(open) => {
                  setSetDialogOpen(open);
                  if (!open) resetSetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Book Set
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSet ? "Edit Book Set" : "Create Book Set"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); saveSetMutation.mutate(setForm); }} className="space-y-4">
                      <div>
                        <Label>Set Name *</Label>
                        <Input
                          required
                          value={setForm.name}
                          onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                          placeholder="e.g., Oxford Grade 3 Complete Set"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Syllabus Type *</Label>
                          <Select
                            value={setForm.syllabus_type_id}
                            onValueChange={(v) => setSetForm({ ...setForm, syllabus_type_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select syllabus" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mixed">Mixed (All Syllabus Types)</SelectItem>
                              {syllabusTypes.filter(s => s.is_active).map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Class *</Label>
                          <Select
                            value={setForm.class_name}
                            onValueChange={(v) => setSetForm({ ...setForm, class_name: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((c) => (
                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Set Price (Rs) *</Label>
                          <Input
                            type="number"
                            required
                            min="0"
                            value={setForm.set_price}
                            onChange={(e) => setSetForm({ ...setForm, set_price: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>No of Books *</Label>
                          <Input
                            type="number"
                            required
                            min="0"
                            value={setForm.number_of_books}
                            onChange={(e) => setSetForm({ ...setForm, number_of_books: e.target.value })}
                            placeholder="Enter number of books in this set"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setSetDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saveSetMutation.isPending}>
                          {editingSet ? "Update Set" : "Create Set"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Book Sets Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set Name</TableHead>
                    <TableHead>Syllabus</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>No of Books</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Set Price</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : bookSets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No book sets found. Click "Create Book Set" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookSets.map((set) => (
                      <TableRow key={set.id} className={set.is_active && set.current_stock === 0 ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium">{set.name}</TableCell>
                        <TableCell>{set.syllabus_types?.name || "Mixed"}</TableCell>
                        <TableCell>{set.class_name}</TableCell>
                        <TableCell>{(set as any).number_of_books || 0}</TableCell>
                        <TableCell>
                          <Badge variant={set.current_stock === 0 ? "destructive" : set.current_stock < 5 ? "outline" : "default"}>
                            {set.current_stock} sets
                          </Badge>
                        </TableCell>
                        <TableCell>Rs {set.set_price.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={set.is_active ? "default" : "secondary"}>
                            {set.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditSet(set)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAdjustSetStock(set)}>
                                Adjust
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSetStatusMutation.mutate({ id: set.id, is_active: set.is_active })}
                              >
                                {set.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          </TabsContent>

          {/* Syllabus Types Tab */}
          <TabsContent value="syllabus">
            <div className="flex justify-end mb-4">
              {isAdmin && (
                <Dialog open={syllabusDialogOpen} onOpenChange={(open) => {
                  setSyllabusDialogOpen(open);
                  if (!open) resetSyllabusForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Syllabus Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSyllabus ? "Edit Syllabus Type" : "Add Syllabus Type"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); saveSyllabusMutation.mutate(syllabusForm); }} className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          required
                          value={syllabusForm.name}
                          onChange={(e) => setSyllabusForm({ ...syllabusForm, name: e.target.value })}
                          placeholder="e.g., Cambridge"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={syllabusForm.description}
                          onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setSyllabusDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saveSyllabusMutation.isPending}>
                          {editingSyllabus ? "Update" : "Add"}
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
                    <TableHead>Syllabus Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syllabusTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No syllabus types found</TableCell>
                    </TableRow>
                  ) : (
                    syllabusTypes.map((syllabus) => (
                      <TableRow key={syllabus.id}>
                        <TableCell className="font-medium">{syllabus.name}</TableCell>
                        <TableCell>{syllabus.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={syllabus.is_active ? "default" : "secondary"}>
                            {syllabus.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditSyllabus(syllabus)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSyllabusStatusMutation.mutate({ id: syllabus.id, is_active: syllabus.is_active })}
                              >
                                {syllabus.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Set Stock Adjustment Dialog */}
      <Dialog open={setStockAdjustDialogOpen} onOpenChange={(open) => {
        setSetStockAdjustDialogOpen(open);
        if (!open) {
          setAdjustingSet(null);
          setSetAdjustmentForm({ quantity: "", notes: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Set Stock: {adjustingSet?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (adjustingSet) {
              adjustSetStockMutation.mutate({
                setId: adjustingSet.id,
                quantity: parseInt(setAdjustmentForm.quantity),
                notes: setAdjustmentForm.notes,
              });
            }
          }} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Stock: {adjustingSet?.current_stock} sets</p>
              <Label>Adjustment Quantity *</Label>
              <Input
                type="number"
                required
                value={setAdjustmentForm.quantity}
                onChange={(e) => setSetAdjustmentForm({ ...setAdjustmentForm, quantity: e.target.value })}
                placeholder="Use positive to add, negative to subtract"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use positive numbers to add stock, negative to remove
              </p>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={setAdjustmentForm.notes}
                onChange={(e) => setSetAdjustmentForm({ ...setAdjustmentForm, notes: e.target.value })}
                placeholder="Reason for adjustment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSetStockAdjustDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={adjustSetStockMutation.isPending}>
                Adjust Stock
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageBooks;
