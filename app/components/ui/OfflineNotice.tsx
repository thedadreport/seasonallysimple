import React, { useEffect, useState } from 'react';
import { useNetworkState } from '@/lib/utils/networkState';

interface OfflineNoticeProps {
  position?: 'top' | 'bottom' | 'float';
  className?: string;
}

/**
 * Component to show a notice when the user is offline
 */
export default function OfflineNotice({
  position = 'top',
  className = ''
}: OfflineNoticeProps) {
  const { online, offlineSince, checkConnection } = useNetworkState();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Update visibility based on network state
  useEffect(() => {
    if (!online) {
      setVisible(true);
    } else {
      // When going back online, show a brief "back online" message before hiding
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [online]);
  
  // Don't render anything if we're online and the notice is not visible
  if (online && !visible) {
    return null;
  }
  
  // Calculate time offline if available
  const timeOffline = offlineSince 
    ? Math.floor((Date.now() - offlineSince.getTime()) / 1000 / 60)
    : 0;
  
  // Position classes
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    float: 'fixed bottom-4 right-4 z-50 max-w-sm rounded-lg shadow-lg'
  };
  
  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div className={`${online ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {online ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">You're back online!</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">You're currently offline</span>
              </>
            )}
          </div>
          
          {!online && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="text-white hover:text-gray-100"
            >
              {expanded ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          )}
        </div>
        
        {!online && expanded && (
          <div className="mt-2 mb-1 text-sm">
            <p>
              {timeOffline > 0 
                ? `You've been offline for ${timeOffline} minute${timeOffline === 1 ? '' : 's'}.` 
                : 'Your internet connection appears to be offline.'}
            </p>
            <p className="mt-1">Don't worry, you can still use the app and your changes will sync when you're back online.</p>
            <button 
              onClick={() => checkConnection()}
              className="mt-2 bg-white text-red-500 px-3 py-1 rounded text-sm font-medium hover:bg-red-50"
            >
              Check Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}