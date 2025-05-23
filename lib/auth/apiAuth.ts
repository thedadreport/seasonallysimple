import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionWrapper, Session } from './session';

/**
 * Type for API handler functions that require authentication
 */
export type AuthenticatedApiHandler = (
  req: NextRequest,
  session: Session
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps API handlers with authentication
 * This ensures consistent authentication and error handling across API routes
 * 
 * @param handler The API handler function that requires authentication
 * @returns A wrapped handler that checks for authentication
 */
export function withAuth(handler: AuthenticatedApiHandler) {
  return async function (req: NextRequest) {
    try {
      // Get the session
      const session = await getServerSessionWrapper();
      
      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Call the handler with the authenticated session
      return await handler(req, session);
    } catch (error) {
      console.error('API authentication error:', error);
      
      // Determine the appropriate error response
      if ((error as any)?.message?.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper function to validate required fields in request body
 * 
 * @param data The request data to validate
 * @param requiredFields Array of field names that must be present
 * @returns NextResponse error or null if validation passes
 */
export function validateRequiredFields(data: any, requiredFields: string[]) {
  const missingFields = requiredFields.filter(field => data[field] === undefined);
  
  if (missingFields.length > 0) {
    return NextResponse.json(
      { 
        error: 'Missing required fields',
        missingFields
      },
      { status: 400 }
    );
  }
  
  return null;
}