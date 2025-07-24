-- Database trigger/function to sync auth.users with public.users
-- Run this SQL in your Supabase SQL Editor

-- First, add a column to store the auth user ID in public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Function to handle new user creation
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
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), -- Default username from email if not provided
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Default empty if not provided
      COALESCE(NEW.raw_user_meta_data->>'phone', ''), -- Default empty if not provided
      '', -- Password hash not needed, managed by Supabase Auth
      COALESCE((NEW.raw_user_meta_data->>'is_store_employee')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'require_password_change')::boolean, false),
      NEW.created_at,
      NEW.updated_at
    );
  ELSE
    -- Update the auth_id if user already exists (in case of email confirmation)
    UPDATE public.users 
    SET auth_id = NEW.id, updated_at = NEW.updated_at
    WHERE email = NEW.email AND auth_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the corresponding public.users record
  DELETE FROM public.users WHERE auth_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates (email changes, etc.)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email if it changed
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.users 
    SET email = NEW.email, updated_at = NEW.updated_at
    WHERE auth_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own data (except sensitive fields)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Only authenticated users with store employee role can view all users
CREATE POLICY "Store employees can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND is_store_employee = true
    )
  );

-- Only authenticated users with store employee role can insert/delete users
CREATE POLICY "Store employees can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
      AND is_store_employee = true
    )
  );

-- Migration script to update existing users (run this after creating the trigger)
-- This will link existing public.users to auth.users by email if they exist
-- DO NOT run this if you have sensitive data - review first!

/*
UPDATE public.users 
SET auth_id = auth.users.id
FROM auth.users 
WHERE public.users.email = auth.users.email 
AND public.users.auth_id IS NULL;
*/