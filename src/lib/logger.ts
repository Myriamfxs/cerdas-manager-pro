/**
 * Environment-aware logging utility
 * Only logs detailed errors in development mode
 * Prevents information leakage in production
 */

export const logError = (context: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, you could send sanitized errors to a monitoring service
  // Example: sendToMonitoring({ context, message: 'An error occurred' });
};

export const logWarn = (context: string, message: string): void => {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message);
  }
};

export const logInfo = (context: string, message: string): void => {
  if (import.meta.env.DEV) {
    console.info(`[${context}]`, message);
  }
};
