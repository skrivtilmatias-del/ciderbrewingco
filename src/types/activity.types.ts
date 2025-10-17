export type ActivityType =
  | 'created'
  | 'stage_changed'
  | 'measurement_added'
  | 'note_added'
  | 'photo_uploaded'
  | 'label_printed'
  | 'qr_scanned'
  | 'exported'
  | 'cloned'
  | 'archived'
  | 'deleted'
  | 'restored'
  | 'updated';

export interface Activity {
  id: string;
  batch_id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_data: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      name?: string;
      avatar_url?: string;
    };
  };
  comments?: ActivityComment[];
  _justAdded?: boolean;
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  parent_comment_id?: string;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

export interface ActivityFilter {
  type?: ActivityType | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}
