import { Pencil, Trash2, Code2 } from 'lucide-react';
import { deleteWebsite, updateWebsite } from '@/app/actions';
import { DELETE_WEBSITE_CONFIRMATION, buildTrackingSnippet } from '@/lib/websites';
import { RangeKey } from '@/lib/range';

type WebsiteSettingsProps = {
  website: {
    id: string;
    name: string;
    domain: string;
  };
  currentDomain: string;
  activeRange: RangeKey;
};

export default function WebsiteSettings({
  website,
  currentDomain,
  activeRange,
}: WebsiteSettingsProps) {
  const snippet = buildTrackingSnippet(currentDomain, website.id);

  return (
    <div className="settings-grid">
      <section className="card">
        <h2 className="chart-title settings-title">
          <Pencil size={20} />
          Website Settings
        </h2>
        <form action={updateWebsite} className="stacked-form">
          <input type="hidden" name="websiteId" value={website.id} />
          <input type="hidden" name="range" value={activeRange} />
          <label className="field">
            <span>Site Name</span>
            <input className="text-input" type="text" name="name" defaultValue={website.name} required />
          </label>
          <label className="field">
            <span>Domain</span>
            <input className="text-input" type="text" name="domain" defaultValue={website.domain} required />
          </label>
          <button type="submit" className="button button-primary">
            Save Changes
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="chart-title settings-title">
          <Code2 size={20} />
          Tracking Snippet
        </h2>
        <p className="subtitle">
          Use this exact snippet for {website.domain}.
        </p>
        <pre className="snippet-box">{snippet}</pre>
      </section>

      <section className="card danger-card">
        <h2 className="chart-title settings-title">
          <Trash2 size={20} />
          Delete Website
        </h2>
        <p className="subtitle">
          Deletes this website and all associated analytics events.
        </p>
        <form action={deleteWebsite} className="stacked-form">
          <input type="hidden" name="websiteId" value={website.id} />
          <input type="hidden" name="range" value={activeRange} />
          <label className="field">
            <span>Type {DELETE_WEBSITE_CONFIRMATION} to confirm</span>
            <input
              className="text-input"
              type="text"
              name="confirmation"
              pattern={DELETE_WEBSITE_CONFIRMATION}
              required
              autoComplete="off"
            />
          </label>
          <button type="submit" className="button button-danger">
            Delete Website
          </button>
        </form>
      </section>
    </div>
  );
}
