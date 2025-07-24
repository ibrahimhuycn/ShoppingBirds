// Diagnostic script to check Supabase database state
// This will help us understand what's happening with your auth issue

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function diagnoseSupa() {
  console.log('🔍 Diagnosing Supabase Database State...\n');
  
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
    console.error('❌ Missing environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check connection
    console.log('1. Testing Supabase connection...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Connection successful\n');
    
    // Test 2: Check public.users table structure
    console.log('2. Checking public.users table structure...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      if (users && users.length > 0) {
        console.log('Sample user columns:', Object.keys(users[0]));
        console.log('auth_id column exists:', 'auth_id' in users[0] ? '✅ Yes' : '❌ No');
      } else {
        console.log('⚠️ No users found in table');
      }
    }
    console.log('');
    
    // Test 3: Count users in public.users
    console.log('3. Counting users in public.users...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting users:', countError.message);
    } else {
      console.log(`✅ Found ${count} users in public.users table`);
    }
    console.log('');
    
    // Test 4: Try to create a test auth user (if needed)
    console.log('4. Testing auth creation (with fake email)...');
    const { data: testAuth, error: testAuthError } = await supabase.auth.signUp({
      email: 'test-' + Date.now() + '@example.com',
      password: 'testpassword123'
    });
    
    if (testAuthError) {
      console.log('⚠️ Auth signup test failed (might be expected):', testAuthError.message);
    } else {
      console.log('✅ Auth signup test worked');
      // Clean up test user if needed
      if (testAuth.user) {
        await supabase.auth.signOut();
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnoseSupa().then(() => {
  console.log('\n🏁 Diagnosis complete!');
  process.exit(0);
}).catch(console.error);