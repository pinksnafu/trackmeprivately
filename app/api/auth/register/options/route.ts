import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { verifySetupToken } from '@/lib/setup';
import { setChallengeCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, token } = await req.json();

    if (!username || !token) {
      return NextResponse.json({ error: 'Missing username or token' }, { status: 400 });
    }

    // Verify setup token
    const isTokenValid = await verifySetupToken(token);
    if (!isTokenValid) {
      return NextResponse.json({ error: 'Invalid or expired Setup Token' }, { status: 401 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already registered' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost';
    const rpID = host.split(':')[0]; // Get domain without port

    const options = await generateRegistrationOptions({
      rpName: 'Privacy Tracker',
      rpID,
      userID: Buffer.from(username), // Simple unique userID bytes
      userName: username,
      userDisplayName: username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Store the challenge cookie
    await setChallengeCookie(options.challenge, username);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
