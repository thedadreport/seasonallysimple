'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import NetworkStatusProvider from "@/app/components/NetworkStatusProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NetworkStatusProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#333333',
            border: '1px solid #e2e8f0',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            style: {
              borderLeft: '4px solid #ef4444',
            },
            duration: 4000,
          },
        }} />
        {children}
      </NetworkStatusProvider>
    </SessionProvider>
  );
}