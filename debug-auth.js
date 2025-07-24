// Debug script to check authentication setup
// Run this in your browser console on the login page or in a Node.js environment

import { supabase } from './src/lib/supabase.js';

async function debugAuth() {
  console.log('🔍 Debugging Authentication Setup...\n');

  try {
    // 1. Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Supabase connection successful');
    console.log('Current session:', session ? 'Logged in' : 'Not logged in');

    // 2. List users in auth.users (if you have service role access)
    console.log('\n2. Checking auth.users table...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.log('❌ Cannot access auth.users (need service role key)');
        console.log('Error:', authError.message);
      } else {
        console.log('✅ Found', authUsers.users.length, 'users in auth.users');
        authUsers.users.forEach(user => {
          console.log(`  - ${user.email} (ID: ${user.id})`);
        });
      }
    } catch (error) {
      console.log('❌ Cannot access auth.users (need service role key)');
    }

    // 3. Check public.users table
    console.log('\n3. Checking public.users table...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, username, full_name, auth_id')
      .order('created_at');
    
    if (publicError) {
      console.log('❌ Error accessing public.users:', publicError.message);
    } else {
      console.log('✅ Found', publicUsers.length, 'users in public.users');
      publicUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.username}) - auth_id: ${user.auth_id || 'NULL'}`);
      });
    }

    // 4. Check if triggers exist
    console.log('\n4. Checking if sync triggers exist...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('check_triggers'); // This would need to be a custom function
    
    // Since we can't easily check triggers from client, we'll skip this

    // 5. Test login with known email
    console.log('\n5. To test login manually, use:');
    console.log('await supabase.auth.signInWithPassword({ email: "your-email", password: "your-password" })');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Usage: 
// debugAuth();

export { debugAuth };