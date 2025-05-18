'use client';

import { SessionProvider } from "next-auth/react";

// Create mock session for development testing
const mockSession = {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  user: {
    id: "mock-user-id",
    name: "Test User",
    email: "test@example.com",
    image: null
  }
};

// Set to true to enable mock session, false to use real authentication
const USE_MOCK_SESSION = true;

// When true, providers.tsx will provide a fake session, effectively logging in a test user
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={USE_MOCK_SESSION ? mockSession : undefined}>
      {children}
    </SessionProvider>
  );
}