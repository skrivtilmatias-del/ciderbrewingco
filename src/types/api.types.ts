/**
 * API token type definitions
 */

export interface APIToken {
  id: string;
  user_id: string;
  name: string;
  token: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateAPITokenInput {
  name: string;
  expires_at?: string;
}

export interface UpdateAPITokenInput {
  name?: string;
  is_active?: boolean;
  expires_at?: string | null;
}
