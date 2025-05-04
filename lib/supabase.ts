import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key should be stored in environment variables
// For development, we can hardcode them (but use environment variables in production)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://your-project-url.supabase.co' || 
    supabaseAnonKey === 'your-anon-key') {
  console.error('Supabase URL or anon key not properly configured!');
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Don't persist session in Telegram environment
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    },
  },
});

// Helper to check if Supabase connection is working
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Error checking Supabase connection:', err);
    return false;
  }
}