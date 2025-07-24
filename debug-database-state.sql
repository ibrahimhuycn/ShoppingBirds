-- DIAGNOSTIC QUERIES - Run these in Supabase SQL Editor to check current state

-- 1. Check the current schema of public.users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if auth_id column exists specifically
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'auth_id'
) AS auth_id_column_exists;

-- 3. Count users in auth.users (you might not have permission for this)
-- If this fails, you don't have access to auth schema
SELECT count(*) as auth_users_count FROM auth.users;

-- 4. List emails from auth.users (if you have access)
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- 5. Count users in public.users
SELECT count(*) as public_users_count FROM public.users;

-- 6. List users from public.users with all columns
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 10;

-- 7. Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 8. Check existing policies on users table
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive, 
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 9. Check if our trigger function exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name = 'handle_new_user'
) AS handle_new_user_function_exists;

-- 10. Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users' 
  AND trigger_name = 'on_auth_user_created';

-- 11. Show table constraints (foreign keys, etc.)
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'users'
  AND tc.table_schema = 'public';

-- 12. Show current database user and permissions
SELECT current_user, session_user;