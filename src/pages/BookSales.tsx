import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Search, ShoppingCart, Trash2, Printer, User, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { BookSetReceipt } from "@/components/book-sales/BookSetReceipt";

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  parent_id: string;
  parents?: { father_name: string; phone: string };
}

interface BookSet {
  id: string;
  name: string;
  set_price: number;
  unit_cost: number;
  current_stock: number;
  class_name: string;
  syllabus_types?: { name: string };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BookSale {
  id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  sale_date: string;
  students?: { name: string; student_id: string; class: string } | null;
  parents?: { father_name: string } | null;
}

const BookSales = () => {
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [customerType, setCustomerType] = useState<'student' | 'walkin'>('student');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saleNotes, setSaleNotes] = useState("");
  const [lastSale, setLastSale] = useState<{
    saleNumber: string;
    saleDate: Date;
    customerName?: string;
    customerType: 'student' | 'walkin';
    items: CartItem[];
    totalAmount: number;
    paymentMethod: string;
  } | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, student_id, name, class, parent_id, parents(father_name, phone)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Student[];
    },
  });

  // Fetch book sets with stock
  const { data: bookSets = [] } = useQuery({
    queryKey: ["book-sets-for-sale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_sets")
        .select("id, name, set_price, unit_cost, current_stock, class_name, syllabus_types(name)")
        .eq("is_active", true)
        .gt("current_stock", 0)
        .order("class_name")
        .order("name");
      if (error) throw error;
      return data as BookSet[];
    },
  });

  // Fetch recent sales
  const { data: recentSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["recent-book-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_sales")
        .select("id, sale_number, total_amount, payment_method, sale_date, students(name, student_id, class), parents(father_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as BookSale[];
    },
  });

  // Get Book/Syllabus Sales category
  const { data: bookSalesCategory } = useQuery({
    queryKey: ["book-sales-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_categories")
        .select("id")
        .eq("name", "Book/Syllabus Sales")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0 || !bookSalesCategory) {
        throw new Error("Missing required data");
      }

      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const customerName = customerType === 'student' && selectedStudent ? selectedStudent.name : 'Walk-in Customer';
      
      // Generate sale number
      const { data: saleNumber } = await supabase.rpc('generate_book_sale_number');
      
      // Create income transaction first
      const { data: accountTxn, error: txnError } = await supabase
        .from("account_transactions")
        .insert({
          transaction_type: "income",
          category_id: bookSalesCategory.id,
          amount: totalAmount,
          description: `Book set sale to ${customerName}`,
          payment_method: paymentMethod,
          recorded_by: user?.id,
          notes: saleNotes || null,
        })
        .select()
        .single();
      
      if (txnError) throw txnError;

      // Create book sale record
      const { data: sale, error: saleError } = await supabase
        .from("book_sales")
        .insert({
          sale_number: saleNumber,
          student_id: customerType === 'student' && selectedStudent ? selectedStudent.id : null,
          parent_id: customerType === 'student' && selectedStudent ? selectedStudent.parent_id : null,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          account_transaction_id: accountTxn.id,
          notes: saleNotes || null,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (saleError) throw saleError;

      // Create sale items and update stock for each set
      for (const item of cart) {
        // Insert sale item
        await supabase.from("book_sale_items").insert({
          book_sale_id: sale.id,
          book_set_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        });

        // Update set stock via stock transaction
        await supabase.from("book_stock_transactions").insert({
          book_set_id: item.id,
          transaction_type: "sale",
          quantity: item.quantity,
          notes: `Sold to ${customerName} - Sale #${saleNumber}`,
          created_by: user?.id,
        });
      }

      return { sale, saleNumber };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recent-book-sales"] });
      queryClient.invalidateQueries({ queryKey: ["book-sets-for-sale"] });
      queryClient.invalidateQueries({ queryKey: ["book-sets"] });
      
      // Store last sale for receipt
      setLastSale({
        saleNumber: data.saleNumber,
        saleDate: new Date(),
        customerName: customerType === 'student' && selectedStudent ? selectedStudent.name : undefined,
        customerType,
        items: [...cart],
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod,
      });
      
      toast({ title: "Sale completed successfully!" });
      setSaleDialogOpen(false);
      setReceiptDialogOpen(true);
      resetSaleForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetSaleForm = () => {
    setSelectedStudent(null);
    setCart([]);
    setPaymentMethod("cash");
    setSaleNotes("");
    setSearchQuery("");
    setCustomerType('student');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter students by search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.parents?.father_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available sets - optionally filter by student's class
  const availableSets = customerType === 'student' && selectedStudent
    ? bookSets.filter(s => s.class_name === selectedStudent.class)
    : bookSets;

  // Add to cart
  const addSetToCart = (set: BookSet) => {
    const existing = cart.find(c => c.id === set.id);
    if (existing) {
      if (existing.quantity >= set.current_stock) {
        toast({ title: "Cannot add more", description: "Not enough stock", variant: "destructive" });
        return;
      }
      setCart(cart.map(c => 
        c.id === set.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        id: set.id,
        name: set.name,
        price: set.set_price,
        quantity: 1,
      }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(c => 
      c.id === id ? { ...c, quantity } : c
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Book Set Sales</h1>
          <p className="text-muted-foreground">Sell book sets to students or walk-in customers</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button onClick={() => setSaleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : recentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No sales yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.sale_number}</TableCell>
                        <TableCell>{formatDate(sale.sale_date)}</TableCell>
                        <TableCell>
                          {sale.students ? (
                            <span>{sale.students.name} ({sale.students.student_id})</span>
                          ) : (
                            <Badge variant="outline">Walk-in</Badge>
                          )}
                        </TableCell>
                        <TableCell>{sale.students?.class || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">Rs {sale.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={(open) => {
        if (!open) resetSaleForm();
        setSaleDialogOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Book Set Sale</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Type Selection */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={customerType === 'student' ? 'default' : 'outline'}
                onClick={() => {
                  setCustomerType('student');
                  setSelectedStudent(null);
                }}
                className="flex-1"
              >
                <User className="mr-2 h-4 w-4" />
                Sell to Student
              </Button>
              <Button
                type="button"
                variant={customerType === 'walkin' ? 'default' : 'outline'}
                onClick={() => {
                  setCustomerType('walkin');
                  setSelectedStudent(null);
                }}
                className="flex-1"
              >
                <UserX className="mr-2 h-4 w-4" />
                Walk-in Customer
              </Button>
            </div>

            {/* Student Selection (only if selling to student) */}
            {customerType === 'student' && !selectedStudent && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, ID, or father's name..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {filteredStudents.slice(0, 20).map((student) => (
                    <div
                      key={student.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.student_id} • {student.class} • Father: {student.parents?.father_name}
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No students found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show student info if selected, or show available sets for walk-in */}
            {(customerType === 'walkin' || selectedStudent) && (
              <>
                {/* Selected Student Info */}
                {customerType === 'student' && selectedStudent && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{selectedStudent.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedStudent.student_id} • {selectedStudent.class} • Father: {selectedStudent.parents?.father_name}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                          Change Student
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {customerType === 'walkin' && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <UserX className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Walk-in Customer</span>
                        <span className="text-sm text-muted-foreground">(All book sets available)</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Sets */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      Available Book Sets
                      {customerType === 'student' && selectedStudent && (
                        <span className="text-sm font-normal text-muted-foreground">
                          (for {selectedStudent.class})
                        </span>
                      )}
                    </h3>
                    
                    {availableSets.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableSets.map((set) => (
                          <div key={set.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <div className="font-medium">{set.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {set.class_name} • {set.syllabus_types?.name || 'Mixed'} • Rs {set.set_price.toLocaleString()} • Stock: {set.current_stock}
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => addSetToCart(set)}
                              disabled={set.current_stock === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8 border rounded-md">
                        No book sets available {customerType === 'student' && selectedStudent ? `for ${selectedStudent.class}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Cart */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart ({cart.length} items)
                    </h3>

                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8 border rounded-md">
                        Cart is empty
                      </p>
                    ) : (
                      <div className="border rounded-md divide-y">
                        {cart.map((item) => (
                          <div key={item.id} className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Rs {item.price.toLocaleString()} × {item.quantity}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-16 h-8"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right font-semibold mt-1">
                              Rs {(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        <div className="p-3 bg-muted/50">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>Rs {cartTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {cart.length > 0 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Payment Method</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="online">Online Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Notes (Optional)</Label>
                          <Input
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                            placeholder="Any additional notes..."
                          />
                        </div>
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => createSaleMutation.mutate()}
                          disabled={createSaleMutation.isPending}
                        >
                          {createSaleMutation.isPending ? "Processing..." : `Complete Sale - Rs ${cartTotal.toLocaleString()}`}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          
          {lastSale && (
            <>
              <BookSetReceipt
                ref={receiptRef}
                saleNumber={lastSale.saleNumber}
                saleDate={lastSale.saleDate}
                customerName={lastSale.customerName}
                customerType={lastSale.customerType}
                items={lastSale.items}
                totalAmount={lastSale.totalAmount}
                paymentMethod={lastSale.paymentMethod}
              />
              
              <div className="flex gap-2 mt-4 print:hidden">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setReceiptDialogOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookSales;
