/**
 * Get the base URL for the application
 * Falls back to window.location.origin in development
 */
export const getBaseUrl = (): string => {
  // Use environment variable if available
  const envUrl = import.meta.env.VITE_APP_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  
  // In production, use the current origin (works for deployed app)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
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
 * Generate QR code URL for a batch
 * Points to server-side redirect endpoint that enforces auth
 * @param batchId - The UUID of the batch
 */
export const makeBatchQrUrl = (batchId: string): string => {
  return `${getSupabaseFunctionsUrl()}/r/batch/${encodeURIComponent(batchId)}`;
};

/**
 * Generate QR code URL for a blend batch
 * Points to server-side redirect endpoint that enforces auth
 * @param blendId - The UUID of the blend batch
 */
export const makeBlendQrUrl = (blendId: string): string => {
  return `${getSupabaseFunctionsUrl()}/r/blend/${encodeURIComponent(blendId)}`;
};
