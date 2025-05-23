'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkState } from '@/lib/utils/networkState';
import { setupNetworkListeners, processPendingOperations } from '@/lib/services/shoppingListService';
import { toast } from 'react-hot-toast';
import OfflineNotice from './ui/OfflineNotice';

interface NetworkContextType {
  online: boolean;
  offlineSince: Date | null;
  lastChecked: Date;
  checkConnection: () => Promise<boolean>;
  pendingOperations: number;
  syncPending: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkStatusProvider');
  }
  return context;
};

export default function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const networkState = useNetworkState();
  const [pendingOperations, setPendingOperations] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Set up listeners for network changes
  useEffect(() => {
    const cleanup = setupNetworkListeners();
    return cleanup;
  }, []);

  // Process pending operations when coming back online
  useEffect(() => {
    if (networkState.online && !syncing && pendingOperations > 0) {
      syncPending();
    }
  }, [networkState.online, pendingOperations]);

  // Function to manually sync pending operations
  const syncPending = async () => {
    if (!networkState.online || syncing) return;
    
    setSyncing(true);
    try {
      const { succeeded, failed } = await processPendingOperations();
      
      if (succeeded > 0) {
        toast.success(`Successfully synced ${succeeded} offline ${succeeded === 1 ? 'change' : 'changes'}`);
      }
      
      if (failed > 0) {
        toast.error(`Failed to sync ${failed} offline ${failed === 1 ? 'change' : 'changes'}`);
      }
      
      // Recheck for any remaining operations
      setPendingOperations(prev => prev - succeeded);
      
    } catch (error) {
      console.error('Error syncing pending operations:', error);
      toast.error('Error syncing changes');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <NetworkContext.Provider 
      value={{ 
        ...networkState, 
        pendingOperations,
        syncPending
      }}
    >
      <OfflineNotice position="top" />
      {children}
    </NetworkContext.Provider>
  );
}