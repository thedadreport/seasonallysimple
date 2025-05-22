import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if the user exists or not for security reasons
      // Still return a success response
      return NextResponse.json(
        { success: true, message: 'If your email is registered, you will receive reset instructions' },
        { status: 200 }
      );
    }

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the reset token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // For now, log the token (in production, you would send an email)
    console.log(`RESET TOKEN for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`);

    // TODO: Send an email with the reset link
    // In a production environment, you would use a service like SendGrid, Mailgun, etc.
    // For development, you can use a mock service or log the reset link

    return NextResponse.json(
      { success: true, message: 'If your email is registered, you will receive reset instructions' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}