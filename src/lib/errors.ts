/**
 * Error sanitization utilities for secure error handling
 */

export const sanitizeError = (error: any): string => {
  // In development, show more detailed errors
  if (import.meta.env.DEV) {
    return error?.message || error?.toString() || 'Unknown error';
  }
  
  // Production: generic messages only to prevent info leakage
  const code = error?.code;
  
  if (code === 'PGRST116') return 'Access denied';
  if (code?.startsWith('23')) return 'Invalid data provided';
  if (code?.startsWith('42')) return 'Invalid request';
  if (code === '23505') return 'This record already exists';
  if (error?.message?.includes('JWT')) return 'Authentication error. Please log in again.';
  
  return 'An error occurred. Please try again.';
};

export const logError = (context: string, error: any) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, integrate with error tracking service (e.g., Sentry)
  // sentry.captureException(error, { tags: { context } });
};
