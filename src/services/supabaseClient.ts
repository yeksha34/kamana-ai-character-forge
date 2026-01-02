
import { createClient } from '@supabase/supabase-js';

// Using the specific environment variable names provided
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL');

export const supabase = isConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

if (!isConfigured) {
  console.warn('Supabase is not configured. The app will run in Local Development Mode (Bypass).');
} else {
  console.log('Supabase client initialized successfully.');
}
