import { useState, useEffect, useCallback } from 'react';

export interface NetworkState {
  online: boolean;
  offlineSince: Date | null;
  lastChecked: Date;
  checkConnection: () => Promise<boolean>;
}

/**
 * Custom hook to monitor and manage network connectivity
 */
export function useNetworkState(): NetworkState {
  const [online, setOnline] = useState<boolean>(navigator?.onLine ?? true);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Active check for connectivity by pinging an endpoint
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Use a small image file from our own server to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isOnline = response.ok;
      
      setOnline(isOnline);
      setLastChecked(new Date());
      
      if (isOnline) {
        setOfflineSince(null);
      } else if (!isOnline && !offlineSince) {
        setOfflineSince(new Date());
      }
      
      return isOnline;
    } catch (error) {
      // If fetch fails, we're offline
      setOnline(false);
      setLastChecked(new Date());
      
      if (!offlineSince) {
        setOfflineSince(new Date());
      }
      
      return false;
    }
  }, [offlineSince]);

  // Listen to browser's online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setOfflineSince(null);
      setLastChecked(new Date());
    };

    const handleOffline = () => {
      setOnline(false);
      if (!offlineSince) {
        setOfflineSince(new Date());
      }
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, offlineSince]);

  return {
    online,
    offlineSince,
    lastChecked,
    checkConnection
  };
}

/**
 * Factory for creating retry logic with exponential backoff
 */
export function createRetryHandler(
  maxRetries = 3,
  initialDelayMs = 1000,
  backoffFactor = 2
) {
  return async function retry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error, delayMs: number) => void
  ): Promise<T> {
    let attempt = 0;
    let delayMs = initialDelayMs;
    
    while (true) {
      try {
        return await operation();
      } catch (err) {
        attempt++;
        
        // Check if we've reached max retries
        if (attempt >= maxRetries) {
          throw err;
        }
        
        // Calculate next delay with exponential backoff
        delayMs = Math.min(delayMs * backoffFactor, 30000); // Cap at 30 seconds
        
        // Add some jitter to prevent synchronized retries
        const jitter = Math.random() * 0.3 * delayMs;
        const finalDelay = Math.floor(delayMs + jitter);
        
        // Notify about retry if callback provided
        if (onRetry && err instanceof Error) {
          onRetry(attempt, err, finalDelay);
        }
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }
  };
}