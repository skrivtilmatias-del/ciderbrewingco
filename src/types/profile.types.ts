/**
 * User profile and role type definitions
 */

export type AppRole = 'production' | 'taster' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  id: string;
  email: string;
  full_name?: string;
  role?: AppRole;
}

export interface UpdateProfileInput {
  email?: string;
  full_name?: string | null;
  role?: AppRole | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface CreateUserRoleInput {
  user_id: string;
  role: AppRole;
}
