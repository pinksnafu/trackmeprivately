import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

// Helper to anonymize IP and User-Agent on a daily basis
function generateSessionId(ip: string, userAgent: string, websiteId: string) {
  // Use today's date string as salt to ensure the hash changes every day.
  // This prevents tracking users across multiple days, making it fully privacy compliant.
  const dateSalt = new Date().toISOString().split('T')[0];
  const hash = crypto.createHash('sha256');
  hash.update(`${ip}-${userAgent}-${websiteId}-${dateSalt}`);
  return hash.digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, url, referrer, width, website } = body;

    if (!website) {
      return NextResponse.json({ error: 'Missing website id' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    const sessionId = generateSessionId(ip, userAgent, website);

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    
    // Simple device detection
    let deviceType = 'desktop';
    if (width && width < 768) {
      deviceType = 'mobile';
    } else if (width && width >= 768 && width < 1024) {
      deviceType = 'tablet';
    }

    await prisma.event.create({
      data: {
        websiteId: website,
        sessionId,
        eventName: event || 'pageview',
        url: url || '/',
        referrer: referrer || null,
        browser,
        os,
        deviceType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Support CORS for external scripts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
