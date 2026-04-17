export type Supplier = {
  id: string;
  supplier_name: string;
  business_name: string;
  contact_number: string;
  address: string;
  opening_balance: number;
  current_balance: number;
  notes: string;
};

export type SupplierTransaction = {
  id: string;
  supplier_id: string;
  type: 'bill' | 'payment';
  amount: number;
  date: string;
  description: string;
  bill_number?: string;
  payment_method?: string;
  balance_after: number;
  created_at: string;
  computedBalance?: number;
};

export type ViewType = 'list' | 'add' | 'payment' | 'bill' | 'ledger';
