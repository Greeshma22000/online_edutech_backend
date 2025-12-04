-- Migration: Create profiles table and update existing users
-- Run this SQL in your Supabase SQL Editor

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'student' NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing users to profiles table
-- This will create profiles for all existing users who don't have one
INSERT INTO public.profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'role', 'student') as role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = COALESCE(EXCLUDED.role, profiles.role);




-- // CREATE TABLE IF NOT EXISTS public.profiles (
-- //   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
-- //   email TEXT UNIQUE,
-- //   name TEXT,
-- //   role TEXT DEFAULT 'student' NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
-- //   avatar_url TEXT,
-- //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
-- //   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- // );

-- // -- Index for role
-- // CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- // -- Auto-create profile function
-- // CREATE OR REPLACE FUNCTION public.handle_new_user()
-- // RETURNS TRIGGER AS $$
-- // BEGIN
-- //   INSERT INTO public.profiles (id, email, role)
-- //   VALUES (
-- //     NEW.id,
-- //     NEW.email,
-- //     COALESCE(NEW.raw_user_meta_data->>'role', 'student')
-- //   )
-- //   ON CONFLICT (id) DO NOTHING;

-- //   RETURN NEW;
-- // END;
-- // $$ LANGUAGE plpgsql SECURITY DEFINER;

-- // -- Trigger for new users
-- // DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- // CREATE TRIGGER on_auth_user_created
-- // AFTER INSERT ON auth.users
-- // FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- // -- Auto-update updated_at column
-- // CREATE OR REPLACE FUNCTION update_timestamp()
-- // RETURNS TRIGGER AS $$
-- // BEGIN
-- //   NEW.updated_at = NOW();
-- //   RETURN NEW;
-- // END;
-- // $$ LANGUAGE plpgsql;

-- // DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
-- // CREATE TRIGGER update_profiles_timestamp
-- // BEFORE UPDATE ON public.profiles
-- // FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- // -- RLS
-- // ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- // CREATE POLICY "service_role_full_access"
-- // ON public.profiles FOR ALL
-- // USING (auth.role() = 'service_role')
-- // WITH CHECK (auth.role() = 'service_role');

-- // CREATE POLICY "user_can_read_own_profile"
-- // ON public.profiles FOR SELECT
-- // USING (auth.uid() = id);

-- // CREATE POLICY "user_can_update_own_profile"
-- // ON public.profiles FOR UPDATE
-- // USING (auth.uid() = id)
-- // WITH CHECK (auth.uid() = id);

-- // -- Migrate existing users
-- // INSERT INTO public.profiles (id, email, role)
-- // SELECT 
-- //   u.id,
-- //   u.email,
-- //   COALESCE(u.raw_user_meta_data->>'role', 'student')
-- // FROM auth.users u
-- // WHERE NOT EXISTS (
-- //   SELECT 1 FROM public.profiles p WHERE p.id = u.id
-- // )
-- // ON CONFLICT (id) DO UPDATE SET
-- //   email = EXCLUDED.email,
-- //   role = COALESCE(EXCLUDED.role, profiles.role);


