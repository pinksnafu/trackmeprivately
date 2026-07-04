import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

function generateSessionId(ip: string, userAgent: string, websiteId: string) {
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

    // Verify website exists
    const dbWebsite = await prisma.website.findUnique({
      where: { id: website }
    });

    if (!dbWebsite) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    // Security: Request Origin Verification (Anti-Spoofing)
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const requestSource = origin || referer;

    if (requestSource && process.env.DISABLE_ORIGIN_VERIFICATION !== 'true') {
      try {
        const sourceUrl = new URL(requestSource);
        const actualHost = sourceUrl.hostname.replace(/^www\./, '');
        const expectedHost = dbWebsite.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

        // Allow localhost for local development checks
        if (actualHost !== expectedHost && actualHost !== 'localhost' && actualHost !== '127.0.0.1') {
          return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          });
        }
      } catch (e) {
        // Handle invalid URL parse gracefully
      }
    }

    const sessionId = generateSessionId(ip, userAgent, website);

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    
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

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
