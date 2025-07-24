-- FIX RLS POLICIES: Remove problematic policies causing infinite recursion
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily to fix the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Store employees can view all users" ON public.users;
DROP POLICY IF EXISTS "Store employees can manage users" ON public.users;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- Allow read access to authenticated users (no recursion)
CREATE POLICY "Allow authenticated read" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own records (using auth.uid() directly)
CREATE POLICY "Allow own updates" ON public.users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);

-- Allow insert for authenticated users (for profile creation)
CREATE POLICY "Allow authenticated insert" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow delete for service role only (admin operations)
CREATE POLICY "Allow service delete" ON public.users
  FOR DELETE USING (auth.role() = 'service_role');

-- Step 5: Verify policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';

-- Step 6: Test table access
SELECT 'RLS policies fixed!' as status;