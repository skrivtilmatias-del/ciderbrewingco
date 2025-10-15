/**
 * Webhook configuration and logging type definitions
 */

export interface WebhookConfig {
  id: string;
  user_id: string;
  name: string;
  endpoint_url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookConfigInput {
  name: string;
  endpoint_url: string;
  secret: string;
  events: string[];
  is_active?: boolean;
}

export interface UpdateWebhookConfigInput {
  name?: string;
  endpoint_url?: string;
  secret?: string;
  events?: string[];
  is_active?: boolean;
}

export interface WebhookLog {
  id: string;
  webhook_config_id: string;
  event_type: string;
  payload: Record<string, any>;
  attempt_count: number;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  next_retry_at: string | null;
  created_at: string;
}
