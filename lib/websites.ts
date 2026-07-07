import { RangeKey, normalizeRange } from './range';

export const DELETE_WEBSITE_CONFIRMATION = 'DELETE';

export function normalizeWebsiteName(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 120) {
    return null;
  }

  return name;
}

export function normalizeWebsiteDomain(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 253 || /\s/.test(trimmed)) {
    return null;
  }

  const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const port = parsed.port ? `:${parsed.port}` : '';
    const normalized = `${hostname}${port}`;

    if (!hostname || normalized.length > 253) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

export function normalizeWebsiteId(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const id = value.trim();
  return id || null;
}

export function normalizeDashboardRange(value: FormDataEntryValue | string | null | undefined): RangeKey {
  return normalizeRange(typeof value === 'string' ? value : undefined);
}

export function buildDashboardHref(websiteId?: string | null, range?: RangeKey) {
  const params = new URLSearchParams();
  if (websiteId) {
    params.set('websiteId', websiteId);
  }
  if (range) {
    params.set('range', range);
  }

  const query = params.toString();
  return query ? `/?${query}` : '/';
}

export function buildTrackingSnippet(currentDomain: string, websiteId: string) {
  return `<script
  src="${currentDomain}/tracker.js"
  data-endpoint="${currentDomain}/api/collect"
  data-website-id="${websiteId}"
  async
></script>`;
}
