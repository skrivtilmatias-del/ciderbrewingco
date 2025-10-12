-- Update tasting_analysis RLS policy to allow production users to see all tastings
DROP POLICY IF EXISTS "Users can view their own tasting analyses" ON public.tasting_analysis;

CREATE POLICY "Users can view tastings based on role" 
ON public.tasting_analysis 
FOR SELECT 
USING (
  -- Users can see their own tastings
  auth.uid() = user_id 
  OR 
  -- Production users can see all tastings
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'production'
  )
);