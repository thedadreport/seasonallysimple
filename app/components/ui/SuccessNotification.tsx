import React, { useEffect, useState } from 'react';

interface SuccessNotificationProps {
  message: string;
  duration?: number;
  onDismiss?: () => void;
  showIcon?: boolean;
  className?: string;
}

/**
 * Component to show a success notification that auto-dismisses
 */
export default function SuccessNotification({
  message,
  duration = 3000,
  onDismiss,
  showIcon = true,
  className = ''
}: SuccessNotificationProps) {
  const [visible, setVisible] = useState(true);
  
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);
  
  if (!visible) return null;
  
  return (
    <div className={`bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative ${className}`}>
      <div className="flex items-center">
        {showIcon && (
          <div className="flex-shrink-0 mr-2">
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div className="flex-grow">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <button
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="text-green-500 hover:text-green-700 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}