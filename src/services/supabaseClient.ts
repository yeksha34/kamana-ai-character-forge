
import { createClient } from '@supabase/supabase-js';

// Using the specific environment variable names provided
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

console.log('Supabase client initialized:', supabase !== null);
