import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FormSubmission {
  id?: string;
  rodzaj_dzialalnosci: string;
  pkd_code: string;
  postal_code: string;
  political_connections: boolean;
  created_at?: string;
  user_ip?: string;
}
