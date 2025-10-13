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
 * Generate QR code URL for a batch
 * @param batchId - The UUID of the batch
 */
export const makeBatchQrUrl = (batchId: string): string => {
  return `${getBaseUrl()}/r/b/${encodeURIComponent(batchId)}`;
};

/**
 * Generate QR code URL for a blend batch
 * @param blendId - The UUID of the blend batch
 */
export const makeBlendQrUrl = (blendId: string): string => {
  return `${getBaseUrl()}/r/l/${encodeURIComponent(blendId)}`;
};
