export type RangeKey = '24h' | '7d' | '30d';
export type ChartBucket = 'hour' | 'day';

export const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

export function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeRange(value?: string | string[]): RangeKey {
  const range = getFirstParam(value);
  return range === '24h' || range === '30d' ? range : '7d';
}

export function getRangeConfig(range: RangeKey): { startDate: Date; bucket: ChartBucket; label: string } {
  const now = new Date();

  if (range === '24h') {
    const startDate = startOfUtcHour(now);
    startDate.setUTCHours(startDate.getUTCHours() - 23);
    return { startDate, bucket: 'hour', label: 'Last 24 hours' };
  }

  const days = range === '30d' ? 30 : 7;
  const startDate = startOfUtcDay(now);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  return { startDate, bucket: 'day', label: `Last ${days} days` };
}

export function startOfUtcHour(date: Date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
  ));
}

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatChartKey(date: Date, bucket: ChartBucket) {
  if (bucket === 'hour') {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    return `${month}/${day} ${hour}:00`;
  }
  return date.toISOString().split('T')[0];
}

export function buildEmptyChartData(startDate: Date, bucket: ChartBucket) {
  const now = bucket === 'hour' ? startOfUtcHour(new Date()) : startOfUtcDay(new Date());
  const cursor = new Date(startDate);
  const data: Array<{ date: string; views: number }> = [];

  while (cursor <= now) {
    data.push({ date: formatChartKey(cursor, bucket), views: 0 });
    if (bucket === 'hour') {
      cursor.setUTCHours(cursor.getUTCHours() + 1);
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return data;
}
