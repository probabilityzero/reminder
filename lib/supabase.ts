import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://xzlycruzioafltqkeirb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHljcnV6aW9hZmx0cWtlaXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjYyOTksImV4cCI6MjA2MTk0MjI5OX0.XCTz3DYxV_qeSE76i8QG0tXCR8MUTOwwqldwxUG_nB4';

// Make sure these are set correctly
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://xzlycruzioafltqkeirb.supabase.co' || 
    supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHljcnV6aW9hZmx0cWtlaXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjYyOTksImV4cCI6MjA2MTk0MjI5OX0.XCTz3DYxV_qeSE76i8QG0tXCR8MUTOwwqldwxUG_nB4') {
  console.error('⚠️ Supabase URL or anon key not properly configured!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist session in Telegram environment
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Check if Supabase is accessible
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple query to check if we can connect
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Error checking Supabase connection:', err);
    return false;
  }
}

// Utility function to log detailed schema information
export async function logTableSchema(tableName: string): Promise<void> {
  try {
    console.log(`🔍 Examining table schema for '${tableName}'...`);
    
    // Query to get all column information
    const { data, error } = await supabase.rpc('get_schema_info', { table_name: tableName });
    
    if (error) {
      console.error(`❌ Error getting schema for '${tableName}':`, error.message);
      return;
    }
    
    console.log(`📋 Schema for '${tableName}':`, data);
  } catch (err) {
    console.error(`❌ Error in logTableSchema for '${tableName}':`, err);
  }
}

// Create the stored procedure for schema info if it doesn't exist
// Run this in Supabase SQL Editor:
/*
CREATE OR REPLACE FUNCTION public.get_schema_info(table_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default
    )
  ) INTO result
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = $1;
  
  RETURN result;
END;
$$;
*/