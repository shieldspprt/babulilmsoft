import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileContainer } from "@/components/mobile/MobileContainer";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileNav } from "@/components/mobile/MobileNav";
import { MobileFormField } from "@/components/mobile/MobileFormField";
import { DesktopWarning } from "@/components/mobile/DesktopWarning";
import { useMobileDetect } from "@/hooks/useMobileDetect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const MobileRecordIncome = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isDesktop } = useMobileDetect();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const { data: categories } = useQuery({
    queryKey: ["income-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_categories")
        .select("*")
        .eq("type", "income")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !isDesktop,
  });

  const recordIncomeMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("account_transactions").insert({
        ...transactionData,
        recorded_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-transactions"] });
      toast.success("Income recorded successfully");
      
      // Reset form
      setAmount("");
      setCategoryId("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setDescription("");
      setNotes("");
      setPaymentMethod("cash");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record income");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !amount || !description || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    recordIncomeMutation.mutate({
      transaction_type: "income",
      category_id: categoryId,
      amount: parseFloat(amount),
      transaction_date: date,
      description,
      notes,
      payment_method: paymentMethod,
    });
  };

  if (isDesktop) {
    return <DesktopWarning />;
  }

  return (
    <MobileContainer>
      <MobileHeader title="Record Income" className="bg-green-600 text-white border-green-700" />

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        <MobileFormField label="Income Category" required>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MobileFormField>

        <MobileFormField label="Amount (PKR)" required>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-12 text-base"
          />
        </MobileFormField>

        <MobileFormField label="Date" required>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 text-base"
          />
        </MobileFormField>

        <MobileFormField label="Payment Method" required>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="online">Online Payment</SelectItem>
            </SelectContent>
          </Select>
        </MobileFormField>

        <MobileFormField label="Description" required>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="h-12 text-base"
          />
        </MobileFormField>

        <MobileFormField label="Additional Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={3}
            className="text-base"
          />
        </MobileFormField>

        <Button
          type="submit"
          className="w-full h-12"
          disabled={recordIncomeMutation.isPending}
        >
          {recordIncomeMutation.isPending ? "Recording..." : "Record Income"}
        </Button>
      </form>

      <MobileNav />
    </MobileContainer>
  );
};

export default MobileRecordIncome;
