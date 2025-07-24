-- URGENT: Run this in your Supabase SQL Editor to fix the login issue
-- This adds the missing auth_id column and sets up the sync system

-- Step 1: Add the auth_id column to public.users table
ALTER TABLE public.users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Step 3: Update any existing users to link with auth.users (if you have any)
-- This attempts to match existing users by email
UPDATE public.users 
SET auth_id = auth.users.id
FROM auth.users 
WHERE public.users.email = auth.users.email 
AND public.users.auth_id IS NULL;

-- Step 4: Enable Row Level Security (RLS) on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Store employees can view all users" ON public.users;
DROP POLICY IF EXISTS "Store employees can manage users" ON public.users;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Store employees can view all users
CREATE POLICY "Store employees can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND is_store_employee = true
    )
  );

-- Store employees can manage users (insert/update/delete)
CREATE POLICY "Store employees can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND is_store_employee = true
    )
  );

-- Step 6: Create functions for automatic user sync (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create a profile if one doesn't already exist for this email
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    INSERT INTO public.users (
      auth_id,
      email,
      username,
      full_name,
      phone,
      password_hash,
      is_store_employee,
      require_password_change,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      '', -- Password hash not needed, managed by Supabase Auth
      COALESCE((NEW.raw_user_meta_data->>'is_store_employee')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'require_password_change')::boolean, false),
      NEW.created_at,
      NEW.updated_at
    );
  ELSE
    -- Update the auth_id if user already exists
    UPDATE public.users 
    SET auth_id = NEW.id, updated_at = NEW.updated_at
    WHERE email = NEW.email AND auth_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for automatic user sync
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Verify the migration worked
SELECT 'Migration completed successfully!' as status;

-- Check if auth_id column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'auth_id';

-- Show any users that still need to be linked
SELECT u.email, u.auth_id, au.id as auth_user_id
FROM public.users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.auth_id IS NULL AND au.id IS NOT NULL;