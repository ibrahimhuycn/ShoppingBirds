-- SQL queries to check user data in Supabase
-- Run these in your Supabase SQL Editor

-- 1. Check if auth_id column exists in public.users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all users in public.users table
SELECT id, email, username, full_name, auth_id, created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Check if sync triggers exist (you need to look for these functions/triggers)
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- 4. Manual query to create a profile for an auth user (replace with your email)
-- ONLY RUN THIS IF YOU CONFIRMED THE USER EXISTS IN AUTH.USERS BUT NOT IN PUBLIC.USERS

/*
INSERT INTO public.users (
  auth_id, 
  email, 
  username, 
  full_name, 
  phone, 
  password_hash, 
  is_store_employee, 
  require_password_change
) VALUES (
  'your-auth-user-uuid-here',  -- Get this from auth.users
  'your-email@example.com',
  'your-username',
  'Your Full Name',
  '',
  '',  -- Empty password_hash since we use Supabase Auth
  false,
  false
);
*/

-- 5. Check if RLS is enabled on users table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 6. List RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';