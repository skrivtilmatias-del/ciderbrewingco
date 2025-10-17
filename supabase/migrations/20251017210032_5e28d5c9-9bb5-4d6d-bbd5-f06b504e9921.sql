-- Add version tracking for optimistic locking
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_by_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_by_id UUID REFERENCES auth.users(id);

-- Create index for real-time queries
CREATE INDEX IF NOT EXISTS idx_batches_updated_at ON batches(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_version ON batches(version);

-- Create function to auto-increment version
CREATE OR REPLACE FUNCTION increment_batch_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version increment
DROP TRIGGER IF EXISTS batch_version_trigger ON batches;
CREATE TRIGGER batch_version_trigger
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION increment_batch_version();

-- Enable realtime for batches table
ALTER PUBLICATION supabase_realtime ADD TABLE batches;