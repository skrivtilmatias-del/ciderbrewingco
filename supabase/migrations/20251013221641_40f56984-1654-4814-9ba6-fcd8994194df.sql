-- Add spillage column to blend_components table
ALTER TABLE public.blend_components 
ADD COLUMN spillage numeric DEFAULT 0;