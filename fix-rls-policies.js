// Fix RLS policies causing infinite recursion
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies causing infinite recursion...\n');
  
  // Read environment variables directly from .env.local
  let supabaseUrl, supabaseKey;
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    
    supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
    supabaseKey = keyMatch ? keyMatch[1].trim() : null;
  } catch (error) {
    console.error('❌ Could not read .env.local file:', error.message);
    return;
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('1. Disabling RLS temporarily...');
    
    // Note: These operations require service role key, which anon key doesn't have
    // We'll need to suggest manual SQL execution instead
    
    console.log('⚠️ Cannot run DDL operations with anon key');
    console.log('You need to run the SQL manually in Supabase SQL Editor');
    console.log('');
    console.log('SQL to run:');
    console.log('------------------------------------------');
    console.log('-- Disable RLS temporarily');
    console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Drop problematic policies');
    console.log('DROP POLICY IF EXISTS "Users can view own profile" ON public.users;');
    console.log('DROP POLICY IF EXISTS "Users can update own profile" ON public.users;');
    console.log('DROP POLICY IF EXISTS "Store employees can view all users" ON public.users;');
    console.log('DROP POLICY IF EXISTS "Store employees can manage users" ON public.users;');
    console.log('');
    console.log('-- Re-enable RLS');
    console.log('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Create simple policies (no recursion)');
    console.log('CREATE POLICY "Allow authenticated read" ON public.users');
    console.log('  FOR SELECT USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('CREATE POLICY "Allow authenticated insert" ON public.users');
    console.log('  FOR INSERT WITH CHECK (auth.role() = \'authenticated\');');
    console.log('------------------------------------------');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSPolicies().then(() => {
  console.log('\n🎯 Copy the SQL above and run it in Supabase SQL Editor!');
  process.exit(0);
}).catch(console.error);