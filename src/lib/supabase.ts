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
