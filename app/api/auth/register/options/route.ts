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

    const isTokenValid = await verifySetupToken(token);
    if (!isTokenValid) {
      return NextResponse.json({ error: 'Invalid or expired Setup Token' }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already registered' }, { status: 400 });
    }

    // Security: Use configured RP ID or fall back to request Host header
    const host = req.headers.get('host') || 'localhost';
    const rpID = process.env.ALLOWED_RP_ID || host.split(':')[0];

    const options = await generateRegistrationOptions({
      rpName: 'Privacy Tracker',
      rpID,
      userID: Buffer.from(username),
      userName: username,
      userDisplayName: username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    await setChallengeCookie(options.challenge, username);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
