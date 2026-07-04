import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { setChallengeCookie } from '@/lib/auth';
import { checkAndGenerateSetupToken } from '@/lib/setup';

export async function POST(req: Request) {
  try {
    await checkAndGenerateSetupToken();

    const user = await prisma.user.findFirst({
      include: { authenticators: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'No admin user configured. Please setup first.' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost';
    const rpID = host.split(':')[0];

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map((auth) => ({
        id: auth.id,
        type: 'public-key',
        transports: JSON.parse(auth.transports || '[]'),
      })),
      userVerification: 'preferred',
    });

    await setChallengeCookie(options.challenge, user.username);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating login options:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
