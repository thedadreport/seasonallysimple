import { toast } from 'react-hot-toast';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  code?: string;
}

/**
 * Parses API errors from response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return {
      error: data.error || 'An unknown error occurred',
      message: data.message,
      details: data.details,
      code: data.code
    };
  } catch (err) {
    return {
      error: response.statusText || 'Failed to parse error response',
      message: `HTTP ${response.status}`
    };
  }
}

/**
 * Displays a user-friendly error message
 */
export function handleError(
  error: unknown, 
  fallbackMessage = 'An unexpected error occurred', 
  severity: ErrorSeverity = 'error'
): void {
  console.error('Error occurred:', error);
  
  let message = fallbackMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    message = errorObj.message || errorObj.error || fallbackMessage;
  }

  // Avoid showing technical details to users
  if (message.includes('ECONNREFUSED') || message.includes('NetworkError')) {
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (message.includes('timeout')) {
    message = 'The server took too long to respond. Please try again later.';
  } else if (message.includes('Unauthorized') || message.includes('401')) {
    message = 'Your session has expired. Please login again.';
  } else if (message.includes('Not Found') || message.includes('404')) {
    message = 'The requested resource was not found.';
  }

  // Display the message based on severity
  switch (severity) {
    case 'error':
      toast.error(message);
      break;
    case 'warning':
      toast.error(message); // Using error toast for warnings too, but could be customized
      break;
    case 'info':
      toast(message);
      break;
  }
}

/**
 * Wraps async operations with error handling
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorMessage = 'An error occurred',
  options: {
    onError?: (error: unknown) => void;
    onSuccess?: (data: T) => void;
    rethrow?: boolean;
  } = {}
): Promise<T | null> {
  try {
    const result = await asyncFn();
    options.onSuccess?.(result);
    return result;
  } catch (error) {
    handleError(error, errorMessage);
    options.onError?.(error);
    
    if (options.rethrow) {
      throw error;
    }
    
    return null;
  }
}