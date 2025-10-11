-- Create storage bucket for batch log images
INSERT INTO storage.buckets (id, name, public)
VALUES ('batch-images', 'batch-images', true);

-- RLS policies for batch-images bucket
CREATE POLICY "Users can view all batch images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'batch-images');

CREATE POLICY "Users can upload their own batch images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'batch-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own batch images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'batch-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own batch images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'batch-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);