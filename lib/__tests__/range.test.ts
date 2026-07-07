import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeRange,
  getRangeConfig,
  buildEmptyChartData,
} from '../range';

describe('Range Parser Utilities', () => {
  describe('normalizeRange', () => {
    test('should fallback to 7d when no value provided', () => {
      expect(normalizeRange()).toBe('7d');
      expect(normalizeRange(undefined)).toBe('7d');
    });

    test('should accept valid RangeKeys', () => {
      expect(normalizeRange('24h')).toBe('24h');
      expect(normalizeRange('7d')).toBe('7d');
      expect(normalizeRange('30d')).toBe('30d');
    });

    test('should fallback to 7d for invalid strings', () => {
      expect(normalizeRange('14d')).toBe('7d');
      expect(normalizeRange('abc')).toBe('7d');
    });

    test('should handle arrays by returning the normalized first element', () => {
      expect(normalizeRange(['30d', '24h'])).toBe('30d');
      expect(normalizeRange(['invalid', '24h'])).toBe('7d');
    });
  });

  describe('getRangeConfig and Date Math', () => {
    beforeEach(() => {
      // Mock system time to a fixed date: 2026-07-06T15:30:45.000Z
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-06T15:30:45.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should configure 24h range bucket and UTC start boundary correctly', () => {
      const config = getRangeConfig('24h');
      expect(config.bucket).toBe('hour');
      expect(config.label).toBe('Last 24 hours');
      // 2026-07-06T15:30:45.000Z -> start of hour is 15:00
      // 15:00 minus 23 hours is 2026-07-05T16:00:00.000Z
      expect(config.startDate.toISOString()).toBe('2026-07-05T16:00:00.000Z');
    });

    test('should configure 7d range bucket and UTC start boundary correctly', () => {
      const config = getRangeConfig('7d');
      expect(config.bucket).toBe('day');
      expect(config.label).toBe('Last 7 days');
      // 2026-07-06T15:30:45.000Z -> start of day is 2026-07-06T00:00:00.000Z
      // minus 6 days is 2026-06-30T00:00:00.000Z
      expect(config.startDate.toISOString()).toBe('2026-06-30T00:00:00.000Z');
    });

    test('should configure 30d range bucket and UTC start boundary correctly', () => {
      const config = getRangeConfig('30d');
      expect(config.bucket).toBe('day');
      expect(config.label).toBe('Last 30 days');
      // 2026-07-06T15:30:45.000Z -> start of day is 2026-07-06T00:00:00.000Z
      // minus 29 days is 2026-06-07T00:00:00.000Z
      expect(config.startDate.toISOString()).toBe('2026-06-07T00:00:00.000Z');
    });
  });

  describe('buildEmptyChartData', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-06T15:30:45.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should build empty bucket lists for daily intervals', () => {
      const startDate = new Date('2026-07-04T00:00:00.000Z');
      const data = buildEmptyChartData(startDate, 'day');
      
      // Expected dates: 2026-07-04, 2026-07-05, 2026-07-06
      expect(data).toHaveLength(3);
      expect(data[0]).toEqual({ date: '2026-07-04', views: 0 });
      expect(data[1]).toEqual({ date: '2026-07-05', views: 0 });
      expect(data[2]).toEqual({ date: '2026-07-06', views: 0 });
    });

    test('should build empty bucket lists for hourly intervals', () => {
      const startDate = new Date('2026-07-06T13:00:00.000Z');
      const data = buildEmptyChartData(startDate, 'hour');
      
      // Expected hours: 13:00, 14:00, 15:00
      expect(data).toHaveLength(3);
      expect(data[0]).toEqual({ date: '07/06 13:00', views: 0 });
      expect(data[1]).toEqual({ date: '07/06 14:00', views: 0 });
      expect(data[2]).toEqual({ date: '07/06 15:00', views: 0 });
    });
  });
});
