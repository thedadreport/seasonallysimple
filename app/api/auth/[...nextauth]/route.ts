// Standard NextAuth API route handler for Next.js App Router
import { handlers } from "@/auth";

// Force dynamic rendering for auth routes
export const dynamic = 'force-dynamic';

// These are ready-to-use API route handlers that NextAuth provides
export const { GET, POST } = handlers;