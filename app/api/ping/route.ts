import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple ping endpoint to check network connectivity
 * This is used by the frontend to verify if the connection to the server is working
 */
export async function GET(request: NextRequest) {
  return new NextResponse(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}