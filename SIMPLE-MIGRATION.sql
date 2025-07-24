-- SIMPLE MIGRATION: Just add the auth_id column (run this in Supabase SQL Editor)

-- Add the auth_id column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- Verify the column was added
SELECT 'Migration completed!' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'auth_id';