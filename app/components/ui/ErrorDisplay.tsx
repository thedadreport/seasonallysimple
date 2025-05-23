import React from 'react';

interface ErrorDisplayProps {
  error?: string | Error | null;
  message?: string;
  onRetry?: () => void;
  retry?: () => void;
  details?: string;
  className?: string;
  severity?: 'error' | 'warning' | 'info';
  title?: string;
  suggestions?: string[];
  showBackButton?: boolean;
}

/**
 * Reusable error display component with retry functionality
 */
export default function ErrorDisplay({
  error,
  message,
  onRetry,
  retry,
  details,
  className = '',
  severity = 'error',
  title = 'Error',
  suggestions = [],
  showBackButton = false
}: ErrorDisplayProps) {
  // Extract error message from different sources
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string'
      ? error
      : message || 'An unexpected error occurred';
  
  // Background and text colors based on severity
  const colors = {
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };
  
  // Icons based on severity
  const Icon = () => {
    switch (severity) {
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  // Determine if we should show the inline or fullpage error
  const showFullPageError = title !== 'Error' || suggestions.length > 0;
  
  // Handle retry function (support both retry and onRetry props)
  const handleRetry = retry || onRetry;
  
  // Full page error display
  if (showFullPageError) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-serif font-bold text-navy mb-8">{title}</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                {errorMessage}
              </h2>
              
              {details && (
                <div className="mt-2 text-sm">
                  <p>{details}</p>
                </div>
              )}
              
              {suggestions.length > 0 && (
                <div className="mt-4 mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Suggestions:</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-6 flex space-x-4">
                {handleRetry && (
                  <button
                    onClick={handleRetry}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                )}
                
                {showBackButton && (
                  <button
                    onClick={() => window.history.back()}
                    className="btn-secondary"
                  >
                    Go Back
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Inline error display (original)
  return (
    <div className={`p-4 rounded-md border ${colors[severity]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{errorMessage}</h3>
          {details && (
            <div className="mt-2 text-sm">
              <p>{details}</p>
            </div>
          )}
          {handleRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}