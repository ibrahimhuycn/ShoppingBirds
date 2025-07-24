-- STEP-BY-STEP FIX: Run these ONE AT A TIME in Supabase SQL Editor

-- STEP 1: Check if auth_id column already exists
-- Run this first to see current state
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- STEP 2: Add auth_id column (run this if auth_id doesn't exist from step 1)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID;

-- STEP 3: Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'auth_id';

-- STEP 4: Add foreign key constraint (only after column exists)
-- Note: This might fail if you don't have permission to reference auth.users
-- If it fails, that's okay - the column will still work
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_auth_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_auth_id_fkey 
        FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- STEP 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- STEP 6: Check your auth users (this might fail if you don't have access)
-- If this fails, skip it - you can check users in the Supabase Auth dashboard
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- STEP 7: Check your public users
SELECT id, email, username, full_name, auth_id, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 8: Final verification - this should return 'true'
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'auth_id'
) AS auth_id_column_exists;