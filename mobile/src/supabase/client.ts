import { createClient } from '@supabase/supabase-js';

// Supabase credentials for development (no role blocks)
const supabaseUrl = 'https://muraarrqsengjbuojhim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cmFhcnJxc2VuZ2pidW9qaGltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE4NTA2NiwiZXhwIjoyMDcwNzYxMDY2fQ.h-HNTfYmuBBBN3_QMdwq_kVOrRl-iNIs_ANJLCUIfQk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Supabase connection by querying a 'ping' table
export async function fetchTestRow() {
  // Make sure you have a 'ping' table with at least one row in your Supabase project
  const { data, error } = await supabase.from('ping').select('*').limit(1);
  if (error) throw error;
  return { success: true, message: 'Supabase DB connected!', data };
}
