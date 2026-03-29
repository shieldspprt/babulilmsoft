import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Navigation from "@/components/Navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  FileText, 
  ArrowLeft, 
  ChevronDown,
  Printer,
  Receipt,
  Wallet,
  PiggyBank,
  BadgePercent,
  Calculator
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";

export default function Reports() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  
  // Collapsible states
  const [feeReportsOpen, setFeeReportsOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [incomeTrackerOpen, setIncomeTrackerOpen] = useState(true);
  const [expenseTrackerOpen, setExpenseTrackerOpen] = useState(true);

  // Generate last 12 months for dropdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  // Fee Reports Query
  const { data: feeData, isLoading: feeLoading } = useQuery({
    queryKey: ["fee-reports", selectedMonth],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data: students } = await supabase
        .from("students")
        .select("id, monthly_fee, is_active")
        .eq("is_active", true);

      const maxCollection = students?.reduce((sum, s) => sum + Number(s.monthly_fee), 0) || 0;

      const { data: payments } = await supabase
        .from("parent_transactions")
        .select("amount, transaction_type")
        .eq("transaction_type", "payment")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      const actualCollection = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const { data: concessions } = await supabase
        .from("student_concessions")
        .select("discount_value, discount_type, student_id, students(base_fee)")
        .or(`valid_until.is.null,valid_until.gte.${format(monthStart, "yyyy-MM-dd")}`)
        .lte("valid_from", format(monthEnd, "yyyy-MM-dd"));

      let totalDiscounts = 0;
      concessions?.forEach((c: any) => {
        const baseFee = c.students?.base_fee || 0;
        if (c.discount_type === "percentage") {
          totalDiscounts += (baseFee * c.discount_value) / 100;
        } else {
          totalDiscounts += Number(c.discount_value);
        }
      });

      const { data: writeoffs } = await supabase
        .from("balance_writeoffs")
        .select("writeoff_amount")
        .gte("writeoff_date", format(monthStart, "yyyy-MM-dd"))
        .lte("writeoff_date", format(monthEnd, "yyyy-MM-dd"));

      const totalWriteoffs = writeoffs?.reduce((sum, w) => sum + Number(w.writeoff_amount), 0) || 0;

      return {
        maxCollection,
        actualCollection,
        totalDiscounts,
        totalWriteoffs,
        collectionRate: maxCollection > 0 ? (actualCollection / maxCollection) * 100 : 0,
      };
    },
  });

  // Accounts Query
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts-reports", selectedMonth],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data: transactions } = await supabase
        .from("account_transactions")
        .select("amount, transaction_type")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      const expenses = transactions
        ?.filter((t) => t.transaction_type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const otherIncome = transactions
        ?.filter((t) => t.transaction_type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return { expenses, otherIncome };
    },
  });

  // Monthly Income Tracker Query
  const { data: monthlyIncome, isLoading: incomeLoading } = useQuery({
    queryKey: ["monthly-income-tracker", selectedMonth],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data, error } = await supabase
        .from("account_transactions")
        .select("*, account_categories(name)")
        .eq("transaction_type", "income")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"))
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Monthly Expense Tracker Query
  const { data: monthlyExpenses, isLoading: expenseLoading } = useQuery({
    queryKey: ["monthly-expenses-tracker", selectedMonth],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data, error } = await supabase
        .from("account_transactions")
        .select("*, account_categories(name)")
        .eq("transaction_type", "expense")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"))
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const totalIncome = monthlyIncome?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
  const totalExpenses = monthlyExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

  const netEffect = (feeData?.actualCollection || 0) + 
                    (accountsData?.otherIncome || 0) - 
                    (accountsData?.expenses || 0);

  const totalInflowAmount = (feeData?.actualCollection || 0) + (accountsData?.otherIncome || 0);
  const totalOutflowAmount = (accountsData?.expenses || 0) + (feeData?.totalDiscounts || 0) + (feeData?.totalWriteoffs || 0);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = feeLoading || accountsLoading || incomeLoading || expenseLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 print:bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-20 print:mt-0 print:py-4">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-primary hover:bg-primary/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handlePrint} className="border-primary text-primary hover:bg-primary/10">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
          
          {/* Title and Filter */}
          <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-lg print:bg-white print:text-foreground print:shadow-none print:p-4 print:border print:border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-accent/20 rounded-lg print:hidden">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Financial Reports</h1>
                    <p className="text-primary-foreground/80 text-sm print:text-muted-foreground">
                      باب العلم سکول - Comprehensive Monthly Overview
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 print:hidden">
                <span className="text-sm text-primary-foreground/80">Reporting Period:</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden print:block">
                <Badge variant="outline" className="text-base border-foreground">
                  {format(new Date(selectedMonth), "MMMM yyyy")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Net Effect Hero Card */}
        <Card className="mb-8 border-2 border-accent bg-gradient-to-r from-accent/10 via-background to-accent/10 shadow-lg print:border print:shadow-none">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-accent/20">
                  <Calculator className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Monthly Net Effect</p>
                  <p className="text-4xl md:text-5xl font-bold" style={{ color: netEffect >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                    {netEffect >= 0 ? '+' : ''} Rs. {netEffect.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {netEffect >= 0 ? 'Surplus' : 'Deficit'} for {format(new Date(selectedMonth), "MMMM yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div className="px-6 py-3 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-xs text-muted-foreground uppercase">Total Inflow</p>
                  <p className="text-xl font-bold text-success">Rs. {totalInflowAmount.toLocaleString()}</p>
                </div>
                <div className="px-6 py-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs text-muted-foreground uppercase">Total Outflow</p>
                  <p className="text-xl font-bold text-destructive">Rs. {totalOutflowAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Collection Section */}
        <Collapsible open={feeReportsOpen} onOpenChange={setFeeReportsOpen} className="mb-6">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Fee Collection Overview</CardTitle>
                      <p className="text-sm text-muted-foreground">Monthly fee collection metrics and performance</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 print:hidden ${feeReportsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">Expected</Badge>
                    </div>
                    <p className="text-2xl font-bold">Rs. {feeData?.maxCollection.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Max Monthly Collection</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-success/5 to-success/10 border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <Badge className="text-xs bg-success/20 text-success border-0">{feeData?.collectionRate.toFixed(0)}%</Badge>
                    </div>
                    <p className="text-2xl font-bold text-success">Rs. {feeData?.actualCollection.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Actual Collection</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <BadgePercent className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-2xl font-bold text-accent">Rs. {feeData?.totalDiscounts.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Discounts</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20">
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-2xl font-bold text-destructive">Rs. {feeData?.totalWriteoffs.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Write-offs</p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Income & Expense Summary Section */}
        <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen} className="mb-6">
          <Card className="border-l-4 border-l-accent shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Wallet className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Income & Expense Summary</CardTitle>
                      <p className="text-sm text-muted-foreground">Breakdown of all income sources and expenses</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 print:hidden ${summaryOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Income Side */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-success/5 to-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <h3 className="font-semibold text-success">Income Sources</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Fee Collection</span>
                        <span className="font-semibold">Rs. {feeData?.actualCollection.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Other Income</span>
                        <span className="font-semibold">Rs. {accountsData?.otherIncome.toLocaleString() || 0}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-semibold">Total Income</span>
                        <span className="text-xl font-bold text-success">Rs. {totalInflowAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expense Side */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <h3 className="font-semibold text-destructive">Outflow</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total Expenses</span>
                        <span className="font-semibold">Rs. {accountsData?.expenses.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Discounts Given</span>
                        <span className="font-semibold">Rs. {feeData?.totalDiscounts.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Write-offs</span>
                        <span className="font-semibold">Rs. {feeData?.totalWriteoffs.toLocaleString() || 0}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-semibold">Total Outflow</span>
                        <span className="text-xl font-bold text-destructive">Rs. {totalOutflowAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Income Tracker Section */}
        <Collapsible open={incomeTrackerOpen} onOpenChange={setIncomeTrackerOpen} className="mb-6">
          <Card className="border-l-4 border-l-success shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <PiggyBank className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Income Tracker</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {monthlyIncome?.length || 0} transactions • Total: Rs. {totalIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-success/20 text-success border-0 print:hidden">
                      Rs. {totalIncome.toLocaleString()}
                    </Badge>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 print:hidden ${incomeTrackerOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Method</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyIncome?.map((income) => (
                        <TableRow key={income.id} className="hover:bg-success/5">
                          <TableCell className="font-medium">{formatDate(income.transaction_date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-success/30 text-success">
                              {income.account_categories?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{income.description}</TableCell>
                          <TableCell className="capitalize">{income.payment_method.replace('_', ' ')}</TableCell>
                          <TableCell className="text-right font-bold text-success">
                            Rs. {Number(income.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!monthlyIncome?.length && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No income recorded for this month
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Expense Tracker Section */}
        <Collapsible open={expenseTrackerOpen} onOpenChange={setExpenseTrackerOpen} className="mb-6">
          <Card className="border-l-4 border-l-destructive shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Expense Tracker</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {monthlyExpenses?.length || 0} transactions • Total: Rs. {totalExpenses.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-destructive/20 text-destructive border-0 print:hidden">
                      Rs. {totalExpenses.toLocaleString()}
                    </Badge>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 print:hidden ${expenseTrackerOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Method</TableHead>
                        <TableHead className="font-semibold">Paid By</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyExpenses?.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-destructive/5">
                          <TableCell className="font-medium">{formatDate(expense.transaction_date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-destructive/30 text-destructive">
                              {expense.account_categories?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="capitalize">{expense.payment_method.replace('_', ' ')}</TableCell>
                          <TableCell>{expense.paid_by || '-'}</TableCell>
                          <TableCell className="text-right font-bold text-destructive">
                            Rs. {Number(expense.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!monthlyExpenses?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No expenses recorded for this month
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8 pb-4 print:mt-4">
          <p>Generated on {formatDate(new Date(), true)}</p>
          <p className="mt-1">باب العلم سکول — رہبر ترقی و کمال</p>
        </div>
      </div>
    </div>
  );
}
