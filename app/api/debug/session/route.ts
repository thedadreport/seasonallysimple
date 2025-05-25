import { NextResponse } from 'next/server';
import { getSession, getServerSessionWrapper } from '@/lib/auth/session';
import { auth } from '@/auth';

export async function GET() {
  try {
    // Get session from auth() function directly
    const directSession = await auth();
    
    // Get session from our wrapper function
    const wrappedSession = await getServerSessionWrapper();
    
    // Get session from our getSession helper
    const helperSession = await getSession();
    
    return NextResponse.json({
      success: true,
      directSession: directSession ? {
        user: directSession.user,
        expires: directSession.expires,
      } : null,
      wrappedSession,
      helperSession: helperSession ? {
        user: helperSession.user,
        expires: helperSession.expires,
      } : null
    });
  } catch (error) {
    console.error('Error in session debug endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}