import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// This is a simple diagnostic endpoint
export async function GET() {
  const headersList = headers();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    headers: {
      'user-agent': headersList.get('user-agent'),
      'x-forwarded-for': headersList.get('x-forwarded-for'),
      'host': headersList.get('host'),
      'accept': headersList.get('accept')
    },
    authVariables: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 15) + '...' || 'not set'
    }
  });
}