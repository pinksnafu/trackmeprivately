import { prisma } from '@/lib/prisma';
import Chart from '@/components/Chart';
import WebsiteSwitcher from '@/components/WebsiteSwitcher';
import { Activity, Users, Monitor, Globe, Plus, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import './globals.css';

export const revalidate = 0; // Dynamic server rendering

async function addWebsite(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const domain = formData.get('domain') as string;

  if (name && domain) {
    try {
      await prisma.website.create({
        data: {
          name,
          domain: domain.toLowerCase().trim(),
        },
      });
    } catch (err) {
      console.error('Failed to create website:', err);
    }
    redirect('/');
  }
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ websiteId?: string }>;
}) {
  const params = await searchParams;
  const websites = await prisma.website.findMany({
    orderBy: { name: 'asc' },
  });

  const activeWebsite = params.websiteId
    ? websites.find((w) => w.id === params.websiteId)
    : websites[0];

  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const currentDomain = `${protocol}://${host}`;

  let stats = null;

  if (activeWebsite) {
    // 1. Total page views & custom events
    const totalViews = await prisma.event.count({
      where: { websiteId: activeWebsite.id },
    });

    // 2. Unique visitors (sessions)
    const uniqueSessionsRaw = await prisma.event.groupBy({
      by: ['sessionId'],
      where: { websiteId: activeWebsite.id },
    });
    const uniqueVisitors = uniqueSessionsRaw.length;

    // 3. Traffic data for charts
    const events = await prisma.event.findMany({
      where: { websiteId: activeWebsite.id },
      orderBy: { createdAt: 'asc' },
    });

    const chartDataMap: Record<string, number> = {};
    events.forEach((e) => {
      const d = e.createdAt.toISOString().split('T')[0];
      chartDataMap[d] = (chartDataMap[d] || 0) + 1;
    });

    const chartData = Object.keys(chartDataMap).map((date) => ({
      date,
      views: chartDataMap[date],
    }));

    // 4. Top Pages
    const topPages = await prisma.event.groupBy({
      by: ['url'],
      where: { websiteId: activeWebsite.id, eventName: 'pageview' },
      _count: { url: true },
      orderBy: { _count: { url: 'desc' } },
      take: 5,
    });

    // 5. Top Referrers
    const topReferrers = await prisma.event.groupBy({
      by: ['referrer'],
      where: { websiteId: activeWebsite.id, referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 5,
    });

    // 6. Custom Events breakdown
    const customEvents = await prisma.event.groupBy({
      by: ['eventName'],
      where: { websiteId: activeWebsite.id, eventName: { not: 'pageview' } },
      _count: { eventName: true },
      orderBy: { _count: { eventName: 'desc' } },
    });

    // 7. System breakdown
    const browsers = await prisma.event.groupBy({
      by: ['browser'],
      where: { websiteId: activeWebsite.id },
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 4,
    });

    stats = {
      totalViews,
      uniqueVisitors,
      chartData,
      topPages,
      topReferrers,
      customEvents,
      browsers,
    };
  }

  return (
    <div className="container">
      {/* Top Header */}
      <div className="header">
        <div>
          <h1 className="title">Analytics Dashboard</h1>
          <p className="subtitle">Privacy-respecting site insights</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Website Switcher Dropdown */}
          {websites.length > 0 && (
            <WebsiteSwitcher websites={websites} activeWebsiteId={activeWebsite?.id} />
          )}

          <a
            href="/api/auth/logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: varColorSecondary(),
              textDecoration: 'none',
              fontSize: '0.9rem',
              border: '1px solid var(--border-color)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
            Logout
          </a>
        </div>
      </div>

      {activeWebsite && stats ? (
        <>
          {/* Stats Summary Cards */}
          <div className="grid">
            <div className="card">
              <div className="card-header">
                <Activity size={18} />
                Total Events
              </div>
              <div className="card-value">{stats.totalViews.toLocaleString()}</div>
            </div>
            <div className="card">
              <div className="card-header">
                <Users size={18} />
                Unique Visitors
              </div>
              <div className="card-value">{stats.uniqueVisitors.toLocaleString()}</div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="chart-container">
            <h2 className="chart-title">Traffic Overview</h2>
            <div style={{ height: '300px' }}>
              <Chart data={stats.chartData} />
            </div>
          </div>

          {/* Lists Breakdowns */}
          <div className="list-container" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <div className="card-header">
                <Monitor size={18} />
                Top Pages
              </div>
              <ul className="list">
                {stats.topPages.map((page, idx) => (
                  <li key={idx} className="list-item">
                    <span className="item-label">{page.url}</span>
                    <span className="item-value">{page._count.url}</span>
                  </li>
                ))}
                {stats.topPages.length === 0 && (
                  <li className="list-item">
                    <span className="item-label">No page views recorded yet</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="card">
              <div className="card-header">
                <Globe size={18} />
                Top Referrers
              </div>
              <ul className="list">
                {stats.topReferrers.map((ref, idx) => (
                  <li key={idx} className="list-item">
                    <span className="item-label">{ref.referrer || 'Direct'}</span>
                    <span className="item-value">{ref._count.referrer}</span>
                  </li>
                ))}
                {stats.topReferrers.length === 0 && (
                  <li className="list-item">
                    <span className="item-label">Direct / Unknown</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Custom Events & Browsers */}
          <div className="list-container">
            <div className="card">
              <div className="card-header">
                <ShieldCheck size={18} />
                Custom Action Conversions
              </div>
              <ul className="list">
                {stats.customEvents.map((evt, idx) => (
                  <li key={idx} className="list-item">
                    <span className="item-label" style={{ color: '#10b981', fontWeight: 600 }}>
                      {evt.eventName}
                    </span>
                    <span className="item-value">{evt._count.eventName}</span>
                  </li>
                ))}
                {stats.customEvents.length === 0 && (
                  <li className="list-item">
                    <span className="item-label">No custom events triggered yet</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="card">
              <div className="card-header">
                <Monitor size={18} />
                Browsers
              </div>
              <ul className="list">
                {stats.browsers.map((b, idx) => (
                  <li key={idx} className="list-item">
                    <span className="item-label">{b.browser || 'Unknown'}</span>
                    <span className="item-value">{b._count.browser}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Integration Guide */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h2 className="chart-title">Integration Code</h2>
            <p className="subtitle">
              Add this script to your site&apos;s header to start tracking visits and custom triggers.
            </p>
            <div className="snippet-box">
              {`<script 
  src="${currentDomain}/tracker.js" 
  data-endpoint="${currentDomain}/api/collect"
  data-website-id="${activeWebsite.id}"
  async
></script>`}
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <p className="subtitle" style={{ fontWeight: 600 }}>Track Custom CTAs / Buttons:</p>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  marginTop: '0.5rem',
                  overflowX: 'auto',
                }}
              >
                {`// Example click tracking
document.getElementById('cta-btn').addEventListener('click', () => {
  window.privacyTracker.track('consulting_cta_click');
});`}
              </pre>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ textAlign: 'center', marginTop: '5%' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Get started by registering a website
            </h2>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
              You need to add at least one domain to begin tracking.
            </p>
          </div>

          {/* Example Integration Preview */}
          <div className="card">
            <h2 className="chart-title">Example Integration Code</h2>
            <p className="subtitle">
              Once you register a domain, you will embed a script like this to begin collecting data:
            </p>
            <div className="snippet-box">
              {`<script 
  src="${currentDomain}/tracker.js" 
  data-endpoint="${currentDomain}/api/collect"
  data-website-id="YOUR_WEBSITE_ID"
  async
></script>`}
            </div>
          </div>
        </div>
      )}

      {/* Register New Website Section */}
      <div className="card" style={{ marginTop: '3rem' }}>
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Register New Domain
        </h3>
        <form
          action={addWebsite}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'flex-end',
            marginTop: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Site Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. My Website"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Domain Name</label>
            <input
              type="text"
              name="domain"
              required
              placeholder="e.g. example.com"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              height: '38px',
            }}
          >
            Create
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

function varColorSecondary() {
  return 'var(--text-secondary)';
}
