// Node.js script to create a 'ping' table in Supabase using the service role key
// Usage: node create_ping_table.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://muraarrqsengjbuojhim.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cmFhcnJxc2VuZ2pidW9qaGltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE4NTA2NiwiZXhwIjoyMDcwNzYxMDY2fQ.h-HNTfYmuBBBN3_QMdwq_kVOrRl-iNIs_ANJLCUIfQk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createPingTable() {
  // Create table if not exists
  const sql = `
    create table if not exists public.ping (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz default now()
    );
    insert into public.ping (id) values (gen_random_uuid()) on conflict do nothing;
  `;
  const { error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.error('Error creating ping table:', error.message);
    process.exit(1);
  }
  console.log('Ping table created or already exists, and at least one row inserted.');
}

createPingTable();
