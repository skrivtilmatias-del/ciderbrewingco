/**
 * Get the base URL for the application
 * CRITICAL: In production, VITE_APP_BASE_URL is mandatory and will fail fast if missing
 * In development, falls back to window.location.origin
 */
export const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_APP_BASE_URL;
  
  // In production, fail fast if VITE_APP_BASE_URL is not set
  if (import.meta.env.PROD && !envUrl) {
    const error = new Error(
      'CRITICAL: VITE_APP_BASE_URL is required in production. ' +
      'Please set it in your environment variables before deploying.'
    );
    console.error(error);
    throw error;
  }
  
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  
  // In development, fall back to window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Final fallback (shouldn't reach here in normal operation)
  return '';
};

/**
 * Get the Supabase Functions URL
 */
export const getSupabaseFunctionsUrl = (): string => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1`;
};

/**
 * Generate signed timestamp for QR URLs
 */
const generateSignature = (path: string, timestamp: number): string => {
  // Simple signature using base64 encoding
  // For production, configure QR_SECRET in Lovable Cloud for HMAC
  const message = `${path}:${timestamp}`;
  return btoa(message).replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m] || m));
};

/**
 * Generate signed QR code URL for a batch
 * @param batchId - The UUID of the batch
 * @param ttlSec - Time-to-live in seconds (default 1800 = 30 minutes)
 */
export const makeBatchQrUrl = (batchId: string, ttlSec = 1800): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `/r/b/${encodeURIComponent(batchId)}`;
  const signature = generateSignature(path, timestamp);
  const origin = getBaseUrl();
  
  return `${origin}${path}?ts=${timestamp}&sig=${signature}&ttl=${ttlSec}`;
};

/**
 * Generate signed QR code URL for a blend batch
 * @param blendId - The UUID of the blend batch
 * @param ttlSec - Time-to-live in seconds (default 1800 = 30 minutes)
 */
export const makeBlendQrUrl = (blendId: string, ttlSec = 1800): string => {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `/r/l/${encodeURIComponent(blendId)}`;
  const signature = generateSignature(path, timestamp);
  const origin = getBaseUrl();
  
  return `${origin}${path}?ts=${timestamp}&sig=${signature}&ttl=${ttlSec}`;
};
