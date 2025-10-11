/**
 * Error handler utility to prevent exposing detailed database errors to users
 * Provides user-friendly error messages while logging details for debugging
 */

export function getUserFriendlyError(error: any): string {
  // Log detailed error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('Database error:', error);
  }
  
  // Handle PostgreSQL error codes
  if (error.code === '23505') {
    return 'This item already exists';
  }
  
  if (error.code === '23503') {
    return 'Cannot delete: item is in use';
  }
  
  if (error.code === '23514') {
    return 'Invalid data format';
  }
  
  // Handle RLS policy violations
  if (error.message?.includes('RLS') || error.message?.includes('policy')) {
    return 'You do not have permission to perform this action';
  }
  
  // Handle authentication errors
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return 'Session expired. Please log in again';
  }
  
  // Generic fallback
  return 'An error occurred. Please try again';
}

export const authErrorMessages: Record<string, string> = {
  'Invalid login credentials': 'Email or password is incorrect',
  'Email not confirmed': 'Please verify your email first',
  'User already registered': 'An account with this email already exists',
  'Password should be at least 6 characters': 'Password must be at least 6 characters',
  'Unable to validate email address: invalid format': 'Please enter a valid email address',
  'Signup disabled': 'New signups are currently disabled',
  'Email rate limit exceeded': 'Too many attempts. Please try again later',
};

export function getAuthErrorMessage(error: any): string {
  if (!error) return 'Authentication failed';
  
  const message = error.message || error.error_description || '';
  
  // Check for known auth error messages
  for (const [key, value] of Object.entries(authErrorMessages)) {
    if (message.includes(key)) {
      return value;
    }
  }
  
  // Log unknown auth errors in development
  if (import.meta.env.DEV && message) {
    console.error('Unknown auth error:', message);
  }
  
  return 'Authentication failed. Please try again';
}
