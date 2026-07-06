'use client';

import { useRouter } from 'next/navigation';

interface Website {
  id: string;
  name: string;
  domain: string;
}

interface SwitcherProps {
  websites: Website[];
  activeWebsiteId?: string;
  activeRange?: string;
}

export default function WebsiteSwitcher({ websites, activeWebsiteId, activeRange }: SwitcherProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams();
    params.set('websiteId', e.target.value);
    if (activeRange) {
      params.set('range', activeRange);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <select
      value={activeWebsiteId || ''}
      onChange={handleChange}
      style={{
        background: 'var(--panel-bg)',
        color: '#fff',
        border: '1px solid var(--border-color)',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {websites.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} ({w.domain})
        </option>
      ))}
    </select>
  );
}
