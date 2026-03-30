import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using publishable or anon key

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type SchoolProfile = {
  id: string;
  user_id: string;
  school_name: string;
  contact: string;
  email: string;
  logo_url: string;
  total_credits: number;
  credit_expires_at: string | null;
  created_at: string;
};

export type CreditRequest = {
  id: string;
  school_id: string;
  credits: number;
  amount_pkr: number;
  payment_method: string;
  payment_reference: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type Class = {
  id: string;
  school_id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Teacher = {
  id: string;
  school_id: string;
  name: string;
  cnic: string;
  gender: 'Male' | 'Female';
  personal_contact: string;
  home_contact: string;
  address: string;
  education: string;
  salary: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  type: 'Teacher' | 'Staff';
};

export type Supplier = {
  id: string;
  school_id: string;
  name: string;
  business_name: string;
  contact: string;
  address: string;
  opening_balance: number;
  current_balance: number;
  total_billed: number;
  total_paid: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplierTransaction = {
  id: string;
  school_id: string;
  supplier_id: string;
  type: 'bill' | 'payment';
  amount: number;
  date: string;
  description: string;
  notes: string;
  payment_method?: string;
  bill_number?: string;
  balance_after: number;
  created_at: string;
};

