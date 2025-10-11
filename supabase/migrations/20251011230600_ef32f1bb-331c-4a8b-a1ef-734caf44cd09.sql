-- Create public bucket for batch images if missing
insert into storage.buckets (id, name, public)
values ('batch-images', 'batch-images', true)
on conflict (id) do nothing;

-- Allow public read of images
create policy "Public read access for batch images"
on storage.objects
for select
using (bucket_id = 'batch-images');

-- Allow authenticated users to upload to a folder prefixed by their user id
create policy "Users can upload to their folder in batch-images"
on storage.objects
for insert
with check (
  bucket_id = 'batch-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own images
create policy "Users can update their images in batch-images"
on storage.objects
for update
using (
  bucket_id = 'batch-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own images
create policy "Users can delete their images in batch-images"
on storage.objects
for delete
using (
  bucket_id = 'batch-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);