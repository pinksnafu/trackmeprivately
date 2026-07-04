import { prisma } from '@/lib/prisma';
import Chart from '@/components/Chart';
import { Activity, Users, Monitor, Globe } from 'lucide-react';
import './globals.css';

export const revalidate = 0; // Disable static rendering for the dashboard

async function getStats() {
  const website = await prisma.website.findFirst();
  if (!website) return null;

  // Aggregate stats
  const totalViews = await prisma.event.count({ where: { websiteId: website.id } });
  
  const uniqueSessionsRaw = await prisma.event.groupBy({
    by: ['sessionId'],
    where: { websiteId: website.id },
  });
  const uniqueVisitors = uniqueSessionsRaw.length;

  // Chart data (mocked grouping by date for simplicity in SQLite without raw queries)
  const events = await prisma.event.findMany({
    where: { websiteId: website.id },
    orderBy: { createdAt: 'asc' }
  });

  const chartDataMap: Record<string, number> = {};
  events.forEach(e => {
    const d = e.createdAt.toISOString().split('T')[0];
    chartDataMap[d] = (chartDataMap[d] || 0) + 1;
  });
  
  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    views: chartDataMap[date]
  }));

  // Top Pages
  const topPagesRaw = await prisma.event.groupBy({
    by: ['url'],
    where: { websiteId: website.id },
    _count: { url: true },
    orderBy: { _count: { url: 'desc' } },
    take: 5
  });

  // Top Referrers
  const topReferrersRaw = await prisma.event.groupBy({
    by: ['referrer'],
    where: { websiteId: website.id, referrer: { not: null } },
    _count: { referrer: true },
    orderBy: { _count: { referrer: 'desc' } },
    take: 5
  });

  return { website, totalViews, uniqueVisitors, chartData, topPages: topPagesRaw, topReferrers: topReferrersRaw };
}

export default async function Dashboard() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1 className="title">No website configured</h1>
        <p className="subtitle">Waiting for the database to be seeded...</p>
      </div>
    );
  }

  const { website, totalViews, uniqueVisitors, chartData, topPages, topReferrers } = stats;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="title">Analytics Dashboard</h1>
          <p className="subtitle">Privacy-first tracking for {website.domain}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', display: 'inline-block', boxShadow: '0 0 10px var(--success-color)' }}></span>
          Live Data
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="card-header">
            <Activity size={18} />
            Total Page Views
          </div>
          <div className="card-value">{totalViews.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-header">
            <Users size={18} />
            Unique Visitors (Sessions)
          </div>
          <div className="card-value">{uniqueVisitors.toLocaleString()}</div>
        </div>
      </div>

      <div className="chart-container">
        <h2 className="chart-title">Traffic Overview</h2>
        <div style={{ height: '300px' }}>
          <Chart data={chartData} />
        </div>
      </div>

      <div className="list-container">
        <div className="card">
          <div className="card-header">
            <Monitor size={18} />
            Top Pages
          </div>
          <ul className="list">
            {topPages.map((page, idx) => (
              <li key={idx} className="list-item">
                <span className="item-label">{page.url}</span>
                <span className="item-value">{page._count.url}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-header">
            <Globe size={18} />
            Top Referrers
          </div>
          <ul className="list">
            {topReferrers.map((ref, idx) => (
              <li key={idx} className="list-item">
                <span className="item-label">{ref.referrer || 'Direct'}</span>
                <span className="item-value">{ref._count.referrer}</span>
              </li>
            ))}
            {topReferrers.length === 0 && <li className="list-item"><span className="item-label">No referrers yet</span></li>}
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="chart-title">Integration Code</h2>
        <p className="subtitle">Add this script to the <code>&lt;head&gt;</code> of your website to start tracking instantly without cookies.</p>
        <div className="snippet-box">
          {`<script 
  src="https://your-analytics-domain.com/tracker.js" 
  data-endpoint="https://your-analytics-domain.com/api/collect"
  data-website-id="${website.id}"
  async
></script>`}
        </div>
      </div>
    </div>
  );
}
