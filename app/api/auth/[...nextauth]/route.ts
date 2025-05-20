// NextAuth.js App Router configuration for v5
import { authOptions } from "@/lib/auth/authOptions";

// Use direct exports instead of the handler pattern for NextAuth v5
export const { GET, POST } = authOptions;