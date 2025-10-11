-- Update RLS policies to allow all authenticated users to view all data
-- while keeping write permissions restricted to owners

-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own batches" ON public.batches;
DROP POLICY IF EXISTS "Users can view logs for their own batches" ON public.batch_logs;
DROP POLICY IF EXISTS "Users can view history for their own batches" ON public.batch_history;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new permissive SELECT policies for authenticated users
CREATE POLICY "Authenticated users can view all batches"
ON public.batches
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all batch logs"
ON public.batch_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all batch history"
ON public.batch_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep existing write policies (owners only can modify their own data)
-- These policies already exist and are correct for owner-only modifications