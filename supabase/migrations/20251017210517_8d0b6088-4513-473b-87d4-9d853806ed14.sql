-- Activity log table
CREATE TABLE IF NOT EXISTS batch_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN (
      'created',
      'stage_changed',
      'measurement_added',
      'note_added',
      'photo_uploaded',
      'label_printed',
      'qr_scanned',
      'exported',
      'cloned',
      'archived',
      'deleted',
      'restored',
      'updated'
    )
  )
);

-- Comments on activities
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES batch_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_comment_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_activities_batch_id ON batch_activities(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_activities_created_at ON batch_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_activities_user_id ON batch_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_activities_type ON batch_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);

-- Enable RLS
ALTER TABLE batch_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view activities" ON batch_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create activities" ON batch_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view comments" ON activity_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments" ON activity_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON activity_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON activity_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE batch_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_comments;